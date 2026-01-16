from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from redis import Redis
from ..deps import get_db
from ..rqueue import get_redis
from ..models import Task, TaskEvent, User
from ..schemas import TaskCreate, TaskOut, TaskPatch, TaskEventCreate, TaskEventOut
from ..events import emit_event
from .auth import get_current_user

router = APIRouter()


@router.post("/projects/{project_id}/tasks", response_model=TaskOut)
def create_task(
    project_id: UUID,
    req: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskOut:
    """Create a new task for a project."""
    t = Task(
        project_id=project_id,
        title=req.title,
        description=req.description,
        type=req.type,
        priority=req.priority,
        requested_by=req.requested_by,
        status="queued",
        created_by_user_id=user.id
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, project_id, "task.created", {
        "task_id": str(t.id),
        "title": t.title,
        "status": t.status,
        "priority": t.priority
    })

    return TaskOut.model_validate(t, from_attributes=True)


@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    project_id: UUID,
    status: str | None = Query(default=None),
    limit: int = 200,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[TaskOut]:
    """
    List tasks for a project.

    Filter by status (comma-separated list).
    """
    q = db.query(Task).filter(Task.project_id == project_id)

    if status:
        statuses = [x.strip() for x in status.split(",") if x.strip()]
        q = q.filter(Task.status.in_(statuses))

    items = q.order_by(Task.priority.asc(), Task.created_at.asc()).limit(limit).all()
    return [TaskOut.model_validate(x, from_attributes=True) for x in items]


@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskOut:
    """Get a task by ID."""
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskOut.model_validate(t, from_attributes=True)


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def patch_task(
    task_id: UUID,
    req: TaskPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskOut:
    """Update a task."""
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.title is not None:
        t.title = req.title
    if req.description is not None:
        t.description = req.description
    if req.type is not None:
        t.type = req.type
    if req.priority is not None:
        t.priority = req.priority
    if req.status is not None:
        t.status = req.status

    t.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(t)

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, t.project_id, "task.updated", {
        "task_id": str(t.id),
        "status": t.status,
        "updated_at": t.updated_at.isoformat()
    })

    return TaskOut.model_validate(t, from_attributes=True)


@router.post("/tasks/{task_id}/events", response_model=TaskEventOut)
def append_task_event(
    task_id: UUID,
    req: TaskEventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TaskEventOut:
    """Append an event to a task's audit trail."""
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    ev = TaskEvent(
        task_id=task_id,
        event_type=req.event_type,
        payload=req.payload
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, t.project_id, "task.event.appended", {
        "task_id": str(task_id),
        "event_type": req.event_type
    })

    return TaskEventOut.model_validate(ev, from_attributes=True)


@router.get("/tasks/{task_id}/events", response_model=list[TaskEventOut])
def list_task_events(
    task_id: UUID,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[TaskEventOut]:
    """List events for a task."""
    events = (
        db.query(TaskEvent)
        .filter(TaskEvent.task_id == task_id)
        .order_by(TaskEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [TaskEventOut.model_validate(e, from_attributes=True) for e in events]
