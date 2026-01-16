from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from redis import Redis
from ..deps import get_db
from ..rqueue import get_redis
from ..models import AgentRun, AgentRunLog, Task, User
from ..schemas import AgentRunOut, RunLogCreate, RunLogOut, RunCompleteRequest
from ..events import emit_event
from ..orchestrator import orchestrator_cycle
from ..schemas import OrchestratorRunRequest, OrchestratorRunResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/runs", response_model=list[AgentRunOut])
def list_runs(
    project_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[AgentRunOut]:
    """List agent runs for a project."""
    items = (
        db.query(AgentRun)
        .filter(AgentRun.project_id == project_id)
        .order_by(AgentRun.started_at.desc())
        .limit(limit)
        .all()
    )
    return [AgentRunOut.model_validate(x, from_attributes=True) for x in items]


@router.get("/runs/{run_id}", response_model=AgentRunOut)
def get_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> AgentRunOut:
    """Get an agent run by ID."""
    r = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")
    return AgentRunOut.model_validate(r, from_attributes=True)


@router.get("/runs/{run_id}/logs", response_model=list[RunLogOut])
def list_run_logs(
    run_id: UUID,
    after_seq: int = Query(default=0),
    limit: int = 2000,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[RunLogOut]:
    """
    List logs for an agent run.

    Use after_seq for pagination to get logs after a specific sequence number.
    """
    logs = (
        db.query(AgentRunLog)
        .filter(AgentRunLog.run_id == run_id)
        .filter(AgentRunLog.seq > after_seq)
        .order_by(AgentRunLog.seq.asc())
        .limit(limit)
        .all()
    )
    return [RunLogOut.model_validate(x, from_attributes=True) for x in logs]


@router.post("/runs/{run_id}/logs", response_model=RunLogOut)
def append_run_log(
    run_id: UUID,
    req: RunLogCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> RunLogOut:
    """
    Append a log entry to an agent run.

    Used by the runner to stream logs back to the system.
    """
    r = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")

    log = AgentRunLog(
        run_id=run_id,
        seq=req.seq,
        stream=req.stream,
        message=req.message
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Emit realtime event for log streaming
    redis: Redis = get_redis()
    emit_event(db, redis, r.project_id, "agent.run.log.appended", {
        "run_id": str(run_id),
        "seq": req.seq,
        "stream": req.stream,
        "message": req.message
    })

    return RunLogOut.model_validate(log, from_attributes=True)


@router.post("/runs/{run_id}/complete", response_model=AgentRunOut)
def complete_run(
    run_id: UUID,
    req: RunCompleteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> AgentRunOut:
    """
    Mark an agent run as complete.

    Updates the run status and optionally updates the associated task.
    """
    r = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")

    r.status = req.status
    r.exit_code = req.exit_code
    r.summary = req.summary
    r.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(r)

    # Update associated task if exists
    if r.task_id:
        task = db.query(Task).filter(Task.id == r.task_id).first()
        if task:
            if req.status == "completed" and req.exit_code == 0:
                task.status = "needs_review"
            elif req.status == "failed":
                task.status = "failed"
            task.updated_at = datetime.now(timezone.utc)
            db.commit()

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, r.project_id, "agent.run.completed", {
        "run_id": str(run_id),
        "status": r.status,
        "exit_code": r.exit_code,
        "summary": r.summary
    })

    return AgentRunOut.model_validate(r, from_attributes=True)


@router.post("/projects/{project_id}/orchestrator/run", response_model=OrchestratorRunResponse)
def trigger_orchestrator(
    project_id: UUID,
    req: OrchestratorRunRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> OrchestratorRunResponse:
    """
    Trigger an orchestrator cycle for a project.

    Processes queued tasks and schedules agent runs.
    """
    redis: Redis = get_redis()

    try:
        result = orchestrator_cycle(db, redis, project_id)
        return OrchestratorRunResponse(
            accepted=True,
            cycle_id=None  # Could add cycle tracking later
        )
    except Exception as e:
        return OrchestratorRunResponse(
            accepted=False,
            cycle_id=None
        )
