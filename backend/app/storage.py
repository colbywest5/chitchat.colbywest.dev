import os
from uuid import UUID
from .settings import settings


def ensure_dirs() -> None:
    os.makedirs(settings.RECORDINGS_DIR, exist_ok=True)
    os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)


def recording_path(recording_id: UUID, ext: str) -> str:
    return os.path.join(settings.RECORDINGS_DIR, f"{recording_id}.{ext}")


def artifact_path(artifact_id: UUID, ext: str) -> str:
    return os.path.join(settings.ARTIFACTS_DIR, f"{artifact_id}.{ext}")
