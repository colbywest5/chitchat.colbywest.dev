import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from redis import Redis
from ..deps import get_db
from ..rqueue import get_redis, get_queue
from ..models import Recording, Conversation, User
from ..schemas import RecordingOut
from ..events import emit_event
from ..storage import recording_path
from .auth import get_current_user

router = APIRouter()


def _get_extension(mime_type: str) -> str:
    """Get file extension from mime type."""
    mime_map = {
        "audio/webm": "webm",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/ogg": "ogg",
        "audio/flac": "flac",
        "audio/m4a": "m4a",
        "audio/mp4": "m4a",
    }
    return mime_map.get(mime_type, "webm")


@router.post("/conversations/{conversation_id}/recordings", response_model=RecordingOut)
async def upload_recording(
    conversation_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> RecordingOut:
    """
    Upload an audio recording to a conversation.

    Stores the file on disk and creates a recording record.
    """
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Generate recording ID and path
    recording_id = uuid.uuid4()
    mime_type = file.content_type or "audio/webm"
    ext = _get_extension(mime_type)
    path = recording_path(recording_id, ext)

    # Save file to disk
    try:
        content = await file.read()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create recording record
    rec = Recording(
        id=recording_id,
        conversation_id=conversation_id,
        storage_path=path,
        mime_type=mime_type
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, c.project_id, "recording.created", {
        "recording_id": str(rec.id),
        "conversation_id": str(conversation_id),
        "mime_type": mime_type
    })

    return RecordingOut.model_validate(rec, from_attributes=True)


@router.get("/recordings/{recording_id}", response_model=RecordingOut)
def get_recording(
    recording_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> RecordingOut:
    """Get a recording by ID."""
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")
    return RecordingOut.model_validate(rec, from_attributes=True)


@router.get("/conversations/{conversation_id}/recordings", response_model=list[RecordingOut])
def list_recordings(
    conversation_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[RecordingOut]:
    """List recordings for a conversation."""
    items = (
        db.query(Recording)
        .filter(Recording.conversation_id == conversation_id)
        .order_by(Recording.created_at.desc())
        .limit(limit)
        .all()
    )
    return [RecordingOut.model_validate(x, from_attributes=True) for x in items]


@router.post("/recordings/{recording_id}/transcribe")
def transcribe_recording(
    recording_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> dict:
    """
    Trigger transcription for a recording.

    Enqueues a transcription job to be processed by the transcription worker.
    """
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    if rec.transcript_text:
        return {"accepted": False, "reason": "Already transcribed"}

    # Enqueue transcription job
    q = get_queue("transcription")
    q.enqueue("app.transcription.transcribe_recording_job", str(recording_id))

    return {"accepted": True}


@router.delete("/recordings/{recording_id}")
def delete_recording(
    recording_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> dict:
    """Delete a recording and its file."""
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    # Delete file from disk
    try:
        if os.path.exists(rec.storage_path):
            os.remove(rec.storage_path)
    except Exception:
        pass  # Continue even if file deletion fails

    db.delete(rec)
    db.commit()
    return {"ok": True}
