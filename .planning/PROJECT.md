# Project: ChitChat (OvermindOps)

## What This Is

An AI agent orchestration platform that enables voice and chat-driven task management for software projects. The system manages multiple AI agents (frontend, backend, QA, infra) that can execute tasks on local repositories, with real-time updates via WebSockets.

## Core Value

A single dashboard where you can speak or type commands, have AI agents execute development tasks, and see live progress - all while maintaining a versioned project state document as the source of truth.

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- WebSocket client (native browser)
- MediaRecorder API for voice

### Backend
- FastAPI (Python 3.11+)
- Uvicorn
- PostgreSQL 16
- SQLAlchemy 2.x + Alembic
- Redis (pub/sub + queues)
- RQ (Redis Queue) for background jobs
- faster-whisper for transcription

### Infrastructure
- Docker Compose for local development
- Disk-based storage for recordings/artifacts

## Architecture

```
┌─────────────┐    ┌─────────────────────────┐    ┌──────────────┐
│   Web UI    │◄──►│  API + WebSocket Gateway │◄──►│  PostgreSQL  │
│  (Next.js)  │    │       (FastAPI)          │    └──────────────┘
└─────────────┘    └───────────┬─────────────┘           │
                               │                          │
                   ┌───────────▼─────────────┐           │
                   │    Orchestrator Worker   │◄──────────┤
                   │         (RQ)            │           │
                   └───────────┬─────────────┘           │
                               │                          │
                   ┌───────────▼─────────────┐           │
                   │     Local Agent Runner   │           │
                   │   (touches your repos)   │           │
                   └─────────────────────────┘           │
                               │                          │
                   ┌───────────▼─────────────┐           │
                   │        Redis            │◄──────────┘
                   │   (pub/sub + queues)    │
                   └─────────────────────────┘
```

## Data Flow

1. UI submits chat or voice command
2. Backend converts to structured request
3. Orchestrator turns requests into tasks
4. Agent runner executes tasks in repos
5. Logs and status stream to UI over WebSockets
6. Project state file is versioned and stored as snapshots

## Key Entities

- **Users/Sessions**: Auth and access control
- **Projects**: Container for all project-related data
- **ProjectStateVersions**: Versioned YAML/JSON state documents
- **Agents**: Configured AI agents (frontend, backend, qa, infra)
- **Tasks**: Work items with status lifecycle
- **TaskEvents**: Audit trail for task changes
- **AgentRuns**: Execution attempts by agents
- **AgentRunLogs**: Streaming log chunks
- **Conversations**: Chat or voice sessions
- **Messages**: Individual messages in conversations
- **Recordings**: Audio recordings with transcripts
- **Artifacts**: Files produced by agents
- **RealtimeEvents**: Event log for debugging/replay

## Source of Truth

- `first.md` - Complete specification including schema, API routes, WebSocket events, and component structure
