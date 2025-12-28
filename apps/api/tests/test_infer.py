import os
os.environ.setdefault("TIKUN_EMBEDDING_BACKEND", "mock")
os.environ.setdefault("TIKUN_DATABASE_URL", "sqlite:///./test.db")

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


def auth_headers() -> dict:
    response = client.post("/api/auth/signup", json={"email": "test@example.com", "password": "Password123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_train_and_infer_pipeline():
    headers = auth_headers()
    sound = client.post(
        "/api/sounds",
        headers=headers,
        json={"name": "Door knock", "description": "Knocking", "sensitivity": 0.7, "active": True},
    ).json()
    wav_bytes = make_wav()
    response = client.post(
        "/api/train/sample",
        headers=headers,
        files={"file": ("sample.wav", wav_bytes, "audio/wav")},
        data={"sound_id": sound["id"], "label": "positive"},
    )
    assert response.status_code == 200

    rebuild = client.post("/api/train/rebuild", headers=headers)
    assert rebuild.status_code == 200

    infer = client.post(
        "/api/infer",
        headers=headers,
        files={"file": ("chunk.wav", wav_bytes, "audio/wav")},
    )
    assert infer.status_code == 200
    payload = infer.json()
    assert "confidence" in payload
