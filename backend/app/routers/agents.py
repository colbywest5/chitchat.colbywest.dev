from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from ..deps import get_db
from ..models import Agent, User
from ..schemas import AgentCreate, AgentPatch, AgentOut
from .auth import get_current_user

router = APIRouter()


@router.post("/projects/{project_id}/agents", response_model=AgentOut)
def create_agent(
    project_id: UUID,
    req: AgentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> AgentOut:
    """Create a new agent for a project."""
    # Check for duplicate agent name
    existing = (
        db.query(Agent)
        .filter(Agent.project_id == project_id)
        .filter(Agent.name == req.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this name already exists")

    a = Agent(
        project_id=project_id,
        name=req.name,
        type=req.type,
        is_enabled=req.is_enabled,
        config_json=req.config_json
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return AgentOut.model_validate(a, from_attributes=True)


@router.get("/projects/{project_id}/agents", response_model=list[AgentOut])
def list_agents(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> list[AgentOut]:
    """List all agents for a project."""
    items = (
        db.query(Agent)
        .filter(Agent.project_id == project_id)
        .order_by(Agent.name)
        .all()
    )
    return [AgentOut.model_validate(x, from_attributes=True) for x in items]


@router.get("/agents/{agent_id}", response_model=AgentOut)
def get_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> AgentOut:
    """Get an agent by ID."""
    a = db.query(Agent).filter(Agent.id == agent_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentOut.model_validate(a, from_attributes=True)


@router.patch("/agents/{agent_id}", response_model=AgentOut)
def patch_agent(
    agent_id: UUID,
    req: AgentPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> AgentOut:
    """Update an agent."""
    a = db.query(Agent).filter(Agent.id == agent_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")

    if req.name is not None:
        # Check for duplicate name
        existing = (
            db.query(Agent)
            .filter(Agent.project_id == a.project_id)
            .filter(Agent.name == req.name)
            .filter(Agent.id != agent_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Agent with this name already exists")
        a.name = req.name

    if req.type is not None:
        a.type = req.type
    if req.is_enabled is not None:
        a.is_enabled = req.is_enabled
    if req.config_json is not None:
        a.config_json = req.config_json

    db.commit()
    db.refresh(a)
    return AgentOut.model_validate(a, from_attributes=True)


@router.delete("/agents/{agent_id}")
def delete_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> dict:
    """Delete an agent."""
    a = db.query(Agent).filter(Agent.id == agent_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")

    db.delete(a)
    db.commit()
    return {"ok": True}
