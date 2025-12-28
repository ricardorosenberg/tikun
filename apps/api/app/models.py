import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .db import Base


def uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=uuid_str)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sounds = relationship("Sound", back_populates="user", cascade="all, delete-orphan")


class Sound(Base):
    __tablename__ = "sounds"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    sensitivity = Column(Float, default=0.6)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sounds")


class TrainingSample(Base):
    __tablename__ = "training_samples"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    sound_id = Column(String, ForeignKey("sounds.id"), nullable=True)
    type = Column(String, nullable=False)
    embedding = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DetectionEvent(Base):
    __tablename__ = "detection_events"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    sound_id = Column(String, ForeignKey("sounds.id"), nullable=True)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
