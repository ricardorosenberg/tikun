import os
os.environ.setdefault("TIKUN_EMBEDDING_BACKEND", "mock")
os.environ.setdefault("TIKUN_DATABASE_URL", "sqlite:///./test_api.db")

import io
import wave
import numpy as np
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def make_wav() -> bytes:
    sample_rate = 16000
    t = np.linspace(0, 0.5, int(sample_rate * 0.5), False)
    tone = 0.2 * np.sin(2 * np.pi * 440 * t)
    pcm = (tone * 32767).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm.tobytes())
    return buffer.getvalue()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["embedding_backend"] == "mock"


def test_signup():
    response = client.post("/api/auth/signup", json={"email": "test1@example.com", "password": "Password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_signup_duplicate_email():
    client.post("/api/auth/signup", json={"email": "test2@example.com", "password": "Password123"})
    response = client.post("/api/auth/signup", json={"email": "test2@example.com", "password": "Password456"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login():
    client.post("/api/auth/signup", json={"email": "test3@example.com", "password": "Password123"})
    # Login should fail for unverified user
    response = client.post("/api/auth/login", json={"email": "test3@example.com", "password": "Password123"})
    assert response.status_code == 403


def test_sounds_crud():
    # Signup and get token
    response = client.post("/api/auth/signup", json={"email": "test4@example.com", "password": "Password123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create sound
    response = client.post(
        "/api/sounds",
        headers=headers,
        json={"name": "Door knock", "description": "Front door", "sensitivity": 0.7, "active": True},
    )
    assert response.status_code == 200
    sound = response.json()
    assert sound["name"] == "Door knock"
    assert sound["sensitivity"] == 0.7
    sound_id = sound["id"]
    
    # List sounds
    response = client.get("/api/sounds", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["sounds"]) >= 1
    
    # Update sound
    response = client.patch(
        f"/api/sounds/{sound_id}",
        headers=headers,
        json={"name": "Front door knock", "sensitivity": 0.8},
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "Front door knock"
    assert updated["sensitivity"] == 0.8
    
    # Delete sound
    response = client.delete(f"/api/sounds/{sound_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "deleted"


def test_train_and_rebuild():
    # Signup and get token
    response = client.post("/api/auth/signup", json={"email": "test5@example.com", "password": "Password123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create sound
    sound = client.post(
        "/api/sounds",
        headers=headers,
        json={"name": "Phone ringing", "description": "Incoming call"},
    ).json()
    
    # Upload training sample
    wav_bytes = make_wav()
    response = client.post(
        "/api/train/sample",
        headers=headers,
        files={"file": ("sample.wav", wav_bytes, "audio/wav")},
        data={"sound_id": sound["id"], "label": "positive"},
    )
    assert response.status_code == 200
    sample = response.json()
    assert sample["sound_id"] == sound["id"]
    assert sample["type"] == "positive"
    
    # Rebuild classifier
    response = client.post("/api/train/rebuild", headers=headers)
    assert response.status_code == 200
    rebuild = response.json()
    assert rebuild["status"] == "rebuilt"
    assert rebuild["samples"] >= 1


def test_inference():
    # Signup and get token
    response = client.post("/api/auth/signup", json={"email": "test6@example.com", "password": "Password123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create sound and train
    sound = client.post(
        "/api/sounds",
        headers=headers,
        json={"name": "Fire alarm", "description": "Emergency"},
    ).json()
    
    wav_bytes = make_wav()
    client.post(
        "/api/train/sample",
        headers=headers,
        files={"file": ("sample.wav", wav_bytes, "audio/wav")},
        data={"sound_id": sound["id"], "label": "positive"},
    )
    client.post("/api/train/rebuild", headers=headers)
    
    # Run inference
    response = client.post(
        "/api/infer",
        headers=headers,
        files={"file": ("chunk.wav", wav_bytes, "audio/wav")},
    )
    assert response.status_code == 200
    prediction = response.json()
    assert "confidence" in prediction
    assert "sound_id" in prediction
    assert "label" in prediction


def test_detections():
    # Signup and get token
    response = client.post("/api/auth/signup", json={"email": "test7@example.com", "password": "Password123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create sound, train, and infer
    sound = client.post(
        "/api/sounds",
        headers=headers,
        json={"name": "Baby crying"},
    ).json()
    
    wav_bytes = make_wav()
    client.post(
        "/api/train/sample",
        headers=headers,
        files={"file": ("sample.wav", wav_bytes, "audio/wav")},
        data={"sound_id": sound["id"], "label": "positive"},
    )
    client.post("/api/train/rebuild", headers=headers)
    client.post(
        "/api/infer",
        headers=headers,
        files={"file": ("chunk.wav", wav_bytes, "audio/wav")},
    )
    
    # Get detections
    response = client.get("/api/detections", headers=headers)
    assert response.status_code == 200
    detections = response.json()
    assert len(detections) >= 1
    assert "confidence" in detections[0]


def test_unauthorized_access():
    # Try to access protected endpoint without token
    response = client.get("/api/sounds")
    assert response.status_code == 401
