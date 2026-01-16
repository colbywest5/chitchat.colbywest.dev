from sqlalchemy.orm import Session
from redis import Redis
from faster_whisper import WhisperModel
from uuid import UUID
from .models import Recording, Message, Conversation
from .events import emit_event
from .settings import settings


_model = None


def _get_model() -> WhisperModel:
    """Lazy-load the Whisper model to avoid loading it on import."""
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe_recording(db: Session, redis: Redis, recording_id: UUID) -> dict:
    """
    Transcribe a recording using faster-whisper.

    Process:
    1. Load recording from DB
    2. Transcribe audio file
    3. Store transcript in recording
    4. Create message in conversation with transcript
    5. Emit realtime event

    Returns:
        dict with ok status and transcript length or error
    """
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec:
        return {"ok": False, "error": "recording not found"}

    try:
        model = _get_model()
        segments, info = model.transcribe(rec.storage_path, vad_filter=True)

        text_parts = []
        segs = []
        for s in segments:
            text_parts.append(s.text)
            segs.append({
                "start": float(s.start),
                "end": float(s.end),
                "text": s.text
            })

        transcript = " ".join([t.strip() for t in text_parts if t.strip()]).strip()

        # Update recording with transcript
        rec.transcript_text = transcript
        rec.transcript_json = {
            "language": info.language,
            "segments": segs,
            "duration": info.duration
        }
        db.commit()

        # Create message in conversation with transcript content
        conv = db.query(Conversation).filter(Conversation.id == rec.conversation_id).first()
        if conv and transcript:
            msg = Message(
                conversation_id=conv.id,
                role="user",
                content=transcript,
                content_format="plain"
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            emit_event(db, redis, conv.project_id, "conversation.message.created", {
                "message_id": str(msg.id),
                "conversation_id": str(conv.id),
                "from_recording": str(recording_id)
            })

        return {"ok": True, "transcript_len": len(transcript)}

    except Exception as e:
        return {"ok": False, "error": str(e)}


def transcribe_recording_job(recording_id: str) -> dict:
    """
    RQ job wrapper for transcription.
    Creates its own DB session and Redis connection.
    """
    from .db import SessionLocal
    from .rqueue import get_redis

    db = SessionLocal()
    redis = get_redis()

    try:
        result = transcribe_recording(db, redis, UUID(recording_id))
        return result
    finally:
        db.close()
