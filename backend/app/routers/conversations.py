from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from redis import Redis
from ..deps import get_db
from ..rqueue import get_redis
from ..models import Conversation, Message, User
from ..schemas import ConversationCreate, ConversationOut, MessageCreate, MessageOut
from ..events import emit_event
from .auth import get_current_user

router = APIRouter()


@router.post("/projects/{project_id}/conversations", response_model=ConversationOut)
def create_conversation(
    project_id: UUID,
    req: ConversationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> ConversationOut:
    """Create a new conversation for a project."""
    c = Conversation(
        project_id=project_id,
        title=req.title,
        mode=req.mode,
        created_by_user_id=user.id
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return ConversationOut.model_validate(c, from_attributes=True)


@router.get("/projects/{project_id}/conversations", response_model=list[ConversationOut])
def list_conversations(
    project_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[ConversationOut]:
    """List conversations for a project."""
    items = (
        db.query(Conversation)
        .filter(Conversation.project_id == project_id)
        .order_by(Conversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [ConversationOut.model_validate(x, from_attributes=True) for x in items]


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> ConversationOut:
    """Get a conversation by ID."""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationOut.model_validate(c, from_attributes=True)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
def create_message(
    conversation_id: UUID,
    req: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> MessageOut:
    """Add a message to a conversation."""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    m = Message(
        conversation_id=conversation_id,
        role=req.role,
        content=req.content,
        content_format=req.content_format,
        related_task_id=req.related_task_id
    )
    db.add(m)
    db.commit()
    db.refresh(m)

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, c.project_id, "conversation.message.created", {
        "message_id": str(m.id),
        "conversation_id": str(conversation_id),
        "role": m.role
    })

    return MessageOut.model_validate(m, from_attributes=True)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: UUID,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[MessageOut]:
    """List messages in a conversation."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )
    return [MessageOut.model_validate(x, from_attributes=True) for x in messages]


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> dict:
    """Delete a conversation and all its messages."""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(c)
    db.commit()
    return {"ok": True}
