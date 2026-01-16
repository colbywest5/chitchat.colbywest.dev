import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from redis import Redis
from ..deps import get_db
from ..rqueue import get_redis
from ..models import Project, ProjectStateVersion, User
from ..schemas import ProjectCreate, ProjectPatch, ProjectOut, StateCreate, StateOut
from ..events import emit_event
from .auth import get_current_user

router = APIRouter()


@router.post("", response_model=ProjectOut)
def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> ProjectOut:
    """Create a new project."""
    p = Project(
        name=req.name,
        description=req.description,
        default_repo_path=req.default_repo_path
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return ProjectOut.model_validate(p, from_attributes=True)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[ProjectOut]:
    """List all projects ordered by last update."""
    items = db.query(Project).order_by(Project.updated_at.desc()).all()
    return [ProjectOut.model_validate(x, from_attributes=True) for x in items]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> ProjectOut:
    """Get a project by ID."""
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectOut.model_validate(p, from_attributes=True)


@router.patch("/{project_id}", response_model=ProjectOut)
def patch_project(
    project_id: UUID,
    req: ProjectPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> ProjectOut:
    """Update a project."""
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.name is not None:
        p.name = req.name
    if req.description is not None:
        p.description = req.description
    if req.default_repo_path is not None:
        p.default_repo_path = req.default_repo_path

    db.commit()
    db.refresh(p)
    return ProjectOut.model_validate(p, from_attributes=True)


@router.get("/{project_id}/state/latest", response_model=StateOut)
def latest_state(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> StateOut:
    """Get the latest state version for a project."""
    v = (
        db.query(ProjectStateVersion)
        .filter(ProjectStateVersion.project_id == project_id)
        .order_by(ProjectStateVersion.version.desc())
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="No state found")

    return StateOut(
        version=int(v.version),
        state_format=v.state_format,
        content=v.content,
        content_hash=v.content_hash
    )


@router.post("/{project_id}/state", response_model=StateOut)
def create_state(
    project_id: UUID,
    req: StateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> StateOut:
    """Create a new state version for a project."""
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get next version number
    latest = (
        db.query(ProjectStateVersion.version)
        .filter(ProjectStateVersion.project_id == project_id)
        .order_by(ProjectStateVersion.version.desc())
        .first()
    )
    next_version = 1 if not latest else int(latest[0]) + 1

    # Hash content
    h = hashlib.sha256(req.content.encode("utf-8")).hexdigest()

    row = ProjectStateVersion(
        project_id=project_id,
        version=next_version,
        state_format=req.state_format,
        content=req.content,
        content_hash=h,
        created_by_user_id=user.id
    )
    db.add(row)
    db.commit()

    # Emit realtime event
    redis: Redis = get_redis()
    emit_event(db, redis, project_id, "project.state.updated", {
        "version": next_version,
        "content_hash": h
    })

    return StateOut(
        version=next_version,
        state_format=req.state_format,
        content=req.content,
        content_hash=h
    )
