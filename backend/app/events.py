import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from sqlalchemy.orm import Session
from redis import Redis
from .models import RealtimeEvent


def emit_event(
    db: Session,
    redis: Redis,
    project_id: UUID,
    event_type: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    envelope = {
        "type": event_type,
        "ts": datetime.now(timezone.utc).isoformat(),
        "project_id": str(project_id),
        "payload": payload,
    }

    db.add(RealtimeEvent(project_id=project_id, event_type=event_type, payload=payload))
    db.commit()

    channel = f"project:{project_id}"
    redis.publish(channel, json.dumps(envelope))
    return envelope
