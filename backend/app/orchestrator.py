from sqlalchemy.orm import Session
from redis import Redis
from uuid import UUID
from .models import Task, Agent, AgentRun
from .events import emit_event
from .rqueue import get_queue


def orchestrator_cycle(db: Session, redis: Redis, project_id: UUID) -> dict:
    """
    Main orchestrator cycle that processes queued tasks and schedules agent runs.

    Cycle states:
    - cycle.started
    - cycle.loaded_state
    - cycle.validated_state
    - cycle.ingested_inputs
    - cycle.planned_tasks
    - cycle.scheduled_runs
    - cycle.updated_state
    - cycle.completed
    """
    emit_event(db, redis, project_id, "orchestrator.cycle.started", {})

    # Find queued tasks ordered by priority and creation time
    queued = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .filter(Task.status == "queued")
        .order_by(Task.priority.asc(), Task.created_at.asc())
        .limit(10)
        .all()
    )

    # Load available agents for this project
    agents = {a.name: a for a in db.query(Agent).filter(Agent.project_id == project_id).all()}

    scheduled = []
    for task in queued:
        # Route task to appropriate agent based on type
        agent_name = _route_task_to_agent(task)
        agent = agents.get(agent_name)

        if not agent or not agent.is_enabled:
            # Block task if no suitable agent available
            task.status = "blocked"
            db.commit()
            emit_event(db, redis, project_id, "task.updated", {
                "task_id": str(task.id),
                "status": task.status
            })
            continue

        # Create agent run
        run = AgentRun(
            project_id=project_id,
            agent_id=agent.id,
            task_id=task.id,
            status="started"
        )
        db.add(run)

        # Update task status to in_progress
        task.status = "in_progress"
        db.commit()
        db.refresh(run)

        emit_event(db, redis, project_id, "agent.run.started", {
            "run_id": str(run.id),
            "task_id": str(task.id),
            "agent_id": str(agent.id)
        })

        # Enqueue job for the runner to pick up
        q = get_queue("orchestrator")
        q.enqueue("app.orchestrator.dispatch_to_runner", str(run.id))

        scheduled.append(str(run.id))

    emit_event(db, redis, project_id, "orchestrator.cycle.completed", {
        "scheduled_runs": scheduled,
        "tasks_processed": len(queued)
    })

    return {"scheduled_runs": scheduled}


def _route_task_to_agent(task: Task) -> str:
    """
    Route a task to the appropriate agent based on task type and description.

    Task types:
    - code_change -> frontend or backend (based on path hints)
    - test -> qa
    - review -> qa
    - doc -> backend
    - research -> backend
    """
    task_type = task.type
    description = task.description.lower() if task.description else ""

    if task_type == "test" or task_type == "review":
        return "qa"

    if task_type == "code_change":
        # Check for frontend/backend hints in description
        frontend_hints = ["frontend", "ui", "component", "react", "css", "tailwind", "page"]
        backend_hints = ["backend", "api", "database", "endpoint", "server", "python"]

        for hint in frontend_hints:
            if hint in description:
                return "frontend"

        for hint in backend_hints:
            if hint in description:
                return "backend"

        # Default to frontend for code_change
        return "frontend"

    # Default to backend for other types
    return "backend"


def dispatch_to_runner(run_id: str) -> None:
    """
    Placeholder: in MVP, the local runner will poll for in_progress runs and pull details via API.
    This stub exists so RQ has a job to represent the dispatch action.

    The runner will:
    1. Poll for runs with status 'started'
    2. Pull run details including task info
    3. Execute the task in the appropriate repo
    4. Stream logs back via API
    5. Complete the run with status and summary
    """
    return
