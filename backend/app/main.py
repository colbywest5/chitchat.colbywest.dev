from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from sqlalchemy.orm import Session
from .settings import settings
from .deps import get_db
from .rqueue import get_redis
from .security import get_user_by_session_token
from .ws import bridge_redis_to_ws
from .storage import ensure_dirs

from .routers import auth, projects, tasks, agents, runs, conversations, recordings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    ensure_dirs()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(runs.router, prefix="/api", tags=["runs"])
app.include_router(conversations.router, prefix="/api", tags=["conversations"])
app.include_router(recordings.router, prefix="/api", tags=["recordings"])


@app.get("/health")
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.websocket("/ws")
async def ws_endpoint(
    ws: WebSocket,
    token: str,
    project_id: str,
    db: Session = Depends(get_db)
) -> None:
    """
    WebSocket endpoint for realtime updates.

    Authenticates user via token and subscribes to project events via Redis pub/sub.
    """
    await ws.accept()

    # Validate token
    user = get_user_by_session_token(db, token)
    if not user or not user.is_active:
        await ws.close(code=4401)
        return

    # Get Redis connection and bridge events
    redis: Redis = get_redis()

    try:
        await bridge_redis_to_ws(redis, project_id, ws)
    except WebSocketDisconnect:
        return
    except Exception:
        await ws.close(code=1011)
        return
