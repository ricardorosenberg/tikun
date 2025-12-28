from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SoundCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sensitivity: float = 0.6
    active: bool = True


class SoundUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    sensitivity: Optional[float] = None
    active: Optional[bool] = None


class SoundOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    sensitivity: float
    active: bool

    class Config:
        from_attributes = True


class DetectionOut(BaseModel):
    id: str
    user_id: str
    sound_id: Optional[str]
    confidence: float
    created_at: str

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    sound_id: Optional[str]
    sound_name: Optional[str]
    confidence: float
    label: str


class TrainSampleOut(BaseModel):
    id: str
    sound_id: Optional[str]
    type: str
    created_at: str


class TrainRebuildOut(BaseModel):
    samples: int
    sounds: int
    status: str


class HealthOut(BaseModel):
    status: str
    embedding_backend: str


class SoundListOut(BaseModel):
    sounds: List[SoundOut]
