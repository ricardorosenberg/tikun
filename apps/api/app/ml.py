from __future__ import annotations
from dataclasses import dataclass
import hashlib
import numpy as np
import soundfile as sf
import resampy
from io import BytesIO
from sklearn.neighbors import NearestNeighbors
from typing import List, Tuple
from .settings import settings


@dataclass
class Prediction:
    label: str
    sound_id: str | None
    sound_name: str | None
    confidence: float


class BaseEmbedder:
    def extract(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        raise NotImplementedError


class MockEmbedder(BaseEmbedder):
    def extract(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        digest = hashlib.sha256(audio.tobytes()).digest()
        rng = np.random.default_rng(int.from_bytes(digest[:8], "little"))
        return rng.random(1024)


class YamnetEmbedder(BaseEmbedder):
    def __init__(self) -> None:
        import tensorflow as tf
        import tensorflow_hub as hub

        self.tf = tf
        self.model = hub.load("https://tfhub.dev/google/yamnet/1")

    def extract(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        tf = self.tf
        if sample_rate != 16000:
            audio = resampy.resample(audio, sample_rate, 16000)
        waveform = tf.convert_to_tensor(audio, dtype=tf.float32)
        scores, embeddings, _ = self.model(waveform)
        embedding = tf.reduce_mean(embeddings, axis=0).numpy()
        return embedding


def load_audio(wav_bytes: bytes) -> Tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(BytesIO(wav_bytes))
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    return audio.astype(np.float32), sample_rate


class UserClassifier:
    def __init__(self) -> None:
        self.nn: NearestNeighbors | None = None
        self.labels: List[str | None] = []
        self.sound_names: List[str | None] = []
        self.embeddings: np.ndarray | None = None

    def fit(self, embeddings: np.ndarray, labels: List[str | None], names: List[str | None]) -> None:
        if len(embeddings) == 0:
            self.nn = None
            self.labels = []
            self.sound_names = []
            self.embeddings = None
            return
        self.nn = NearestNeighbors(n_neighbors=min(5, len(embeddings)), metric="cosine")
        self.nn.fit(embeddings)
        self.labels = labels
        self.sound_names = names
        self.embeddings = embeddings

    def predict(self, embedding: np.ndarray) -> Prediction:
        if self.nn is None or self.embeddings is None:
            return Prediction(label="unknown", sound_id=None, sound_name=None, confidence=0.0)
        distances, indices = self.nn.kneighbors([embedding])
        best_index = indices[0][0]
        distance = distances[0][0]
        confidence = max(0.0, 1.0 - float(distance))
        label = self.labels[best_index]
        sound_name = self.sound_names[best_index]
        return Prediction(label=label or "unknown", sound_id=label, sound_name=sound_name, confidence=confidence)


class ModelRegistry:
    def __init__(self) -> None:
        self.embedder: BaseEmbedder = YamnetEmbedder() if settings.embedding_backend == "yamnet" else MockEmbedder()
        self.classifiers: dict[str, UserClassifier] = {}

    def get_classifier(self, user_id: str) -> UserClassifier:
        if user_id not in self.classifiers:
            self.classifiers[user_id] = UserClassifier()
        return self.classifiers[user_id]


model_registry = ModelRegistry()
