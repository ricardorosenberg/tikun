from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime

from .db import Base, engine, get_db
from .models import User, Sound, TrainingSample, DetectionEvent
from .schemas import (
    UserCreate,
    UserLogin,
    AuthResponse,
    SoundCreate,
    SoundUpdate,
    SoundOut,
    SoundListOut,
    PredictionOut,
    TrainSampleOut,
    TrainRebuildOut,
    DetectionOut,
    HealthOut,
)
from .auth import (
    hash_password,
    verify_password,
    create_token_for_user,
    get_current_user,
    generate_token,
)
from .settings import settings
from .ml import load_audio, model_registry

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tikun API", version="0.1.0")

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


@app.get("/health", response_model=HealthOut)
async def health():
    return {"status": "ok", "embedding_backend": settings.embedding_backend}


@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    token = generate_token()
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        verification_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"[EMAIL] Verify account for {user.email}: http://localhost:3000/verify?token={token}")
    return {"access_token": create_token_for_user(user)}


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    return {"access_token": create_token_for_user(user)}


@app.post("/api/auth/verify")
def verify_email(token: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"status": "verified"}


@app.post("/api/auth/forgot")
def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"status": "ok"}
    token = generate_token()
    user.reset_token = token
    db.commit()
    print(f"[EMAIL] Reset password for {user.email}: http://localhost:3000/reset?token={token}")
    return {"status": "sent"}


@app.post("/api/auth/reset")
def reset_password(token: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.hashed_password = hash_password(password)
    user.reset_token = None
    db.commit()
    return {"status": "updated"}


@app.get("/api/sounds", response_model=SoundListOut)
async def list_sounds(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sounds = db.query(Sound).filter(Sound.user_id == current_user.id).all()
    return {"sounds": sounds}


@app.post("/api/sounds", response_model=SoundOut)
async def create_sound(payload: SoundCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sound = Sound(user_id=current_user.id, **payload.model_dump())
    db.add(sound)
    db.commit()
    db.refresh(sound)
    return sound


@app.patch("/api/sounds/{sound_id}", response_model=SoundOut)
async def update_sound(
    sound_id: str,
    payload: SoundUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sound = db.query(Sound).filter(Sound.id == sound_id, Sound.user_id == current_user.id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(sound, key, value)
    db.commit()
    db.refresh(sound)
    return sound


@app.delete("/api/sounds/{sound_id}")
async def delete_sound(sound_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sound = db.query(Sound).filter(Sound.id == sound_id, Sound.user_id == current_user.id).first()
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    db.delete(sound)
    db.commit()
    return {"status": "deleted"}


@app.post("/api/train/sample", response_model=TrainSampleOut)
async def train_sample(
    file: UploadFile = File(...),
    sound_id: Optional[str] = Form(None),
    label: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    audio, sample_rate = load_audio(data)
    embedding = model_registry.embedder.extract(audio, sample_rate)
    sample = TrainingSample(
        user_id=current_user.id,
        sound_id=sound_id,
        type=label,
        embedding=embedding.tolist(),
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return TrainSampleOut(id=sample.id, sound_id=sample.sound_id, type=sample.type, created_at=sample.created_at.isoformat())


@app.post("/api/train/rebuild", response_model=TrainRebuildOut)
async def rebuild(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    samples = db.query(TrainingSample).filter(TrainingSample.user_id == current_user.id).all()
    sounds = db.query(Sound).filter(Sound.user_id == current_user.id).all()
    sound_map = {sound.id: sound.name for sound in sounds}
    embeddings = []
    labels = []
    names = []
    for sample in samples:
        embeddings.append(sample.embedding)
        labels.append(sample.sound_id)
        names.append(sound_map.get(sample.sound_id))
    if embeddings:
        import numpy as np

        model_registry.get_classifier(current_user.id).fit(np.array(embeddings), labels, names)
    else:
        model_registry.get_classifier(current_user.id).fit([], [], [])
    return {"samples": len(samples), "sounds": len(sounds), "status": "rebuilt"}


@app.post("/api/infer", response_model=PredictionOut)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def infer(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    audio, sample_rate = load_audio(data)
    embedding = model_registry.embedder.extract(audio, sample_rate)
    prediction = model_registry.get_classifier(current_user.id).predict(embedding)
    detection = DetectionEvent(
        user_id=current_user.id,
        sound_id=prediction.sound_id,
        confidence=prediction.confidence,
        created_at=datetime.utcnow(),
    )
    db.add(detection)
    db.commit()
    return {
        "sound_id": prediction.sound_id,
        "sound_name": prediction.sound_name,
        "confidence": prediction.confidence,
        "label": prediction.label,
    }


@app.get("/api/detections", response_model=list[DetectionOut])
async def detections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = (
        db.query(DetectionEvent)
        .filter(DetectionEvent.user_id == current_user.id)
        .order_by(DetectionEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return events
