from pydantic import BaseModel, EmailStr, Field
from typing import Any, Literal
from uuid import UUID
from datetime import datetime


# Auth schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: datetime


class UserOut(BaseModel):
    id: UUID
    email: str
    is_admin: bool
    is_active: bool
    created_at: datetime


# Project schemas
class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    default_repo_path: str | None = None


class ProjectPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    default_repo_path: str | None = None


class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    default_repo_path: str | None
    created_at: datetime
    updated_at: datetime


# State schemas
class StateCreate(BaseModel):
    state_format: Literal["yaml", "json"] = "yaml"
    content: str


class StateOut(BaseModel):
    version: int
    state_format: str
    content: str
    content_hash: str


# Agent schemas
class AgentCreate(BaseModel):
    name: str
    type: str = "local"
    is_enabled: bool = True
    config_json: dict[str, Any] = Field(default_factory=dict)


class AgentPatch(BaseModel):
    name: str | None = None
    type: str | None = None
    is_enabled: bool | None = None
    config_json: dict[str, Any] | None = None


class AgentOut(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    type: str
    is_enabled: bool
    config_json: dict[str, Any]
    created_at: datetime


# Task schemas
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    type: str = "code_change"
    priority: int = 3
    requested_by: str = "chat"


class TaskOut(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: str
    type: str
    priority: int
    status: str
    requested_by: str
    created_at: datetime
    updated_at: datetime


class TaskPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    priority: int | None = None
    status: str | None = None


class TaskEventCreate(BaseModel):
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class TaskEventOut(BaseModel):
    id: UUID
    task_id: UUID
    event_type: str
    payload: dict[str, Any]
    created_at: datetime


# Agent Run schemas
class AgentRunOut(BaseModel):
    id: UUID
    project_id: UUID
    agent_id: UUID
    task_id: UUID | None
    status: str
    started_at: datetime
    finished_at: datetime | None
    exit_code: int | None
    summary: str | None
    metrics: dict[str, Any] | None


class RunLogCreate(BaseModel):
    seq: int
    stream: str = "stdout"
    message: str


class RunLogOut(BaseModel):
    id: UUID
    run_id: UUID
    seq: int
    stream: str
    message: str
    created_at: datetime


class RunCompleteRequest(BaseModel):
    status: str
    exit_code: int
    summary: str


# Conversation schemas
class ConversationCreate(BaseModel):
    title: str | None = None
    mode: Literal["text", "voice"] = "text"


class ConversationOut(BaseModel):
    id: UUID
    project_id: UUID
    title: str | None
    mode: str
    created_by_user_id: UUID
    created_at: datetime


class MessageCreate(BaseModel):
    role: str
    content: str
    content_format: str = "plain"
    related_task_id: UUID | None = None


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    content_format: str
    related_task_id: UUID | None
    created_at: datetime


# Recording schemas
class RecordingOut(BaseModel):
    id: UUID
    conversation_id: UUID
    storage_path: str
    mime_type: str
    duration_ms: int | None
    transcript_text: str | None
    transcript_json: dict[str, Any] | None
    created_at: datetime


# Orchestrator schemas
class OrchestratorRunRequest(BaseModel):
    mode: str = "incremental"


class OrchestratorRunResponse(BaseModel):
    accepted: bool
    cycle_id: str | None = None
