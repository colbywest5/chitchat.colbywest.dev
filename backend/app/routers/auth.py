from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..deps import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, UserOut
from ..security import verify_password, create_session, get_user_by_session_token, revoke_session

router = APIRouter()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate bearer token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization[7:]  # Remove "Bearer " prefix
    user = get_user_by_session_token(db, token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="User account is disabled")

    return user


def get_token_from_header(authorization: str | None = Header(default=None)) -> str:
    """Extract token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization")
    return authorization[7:]


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """
    Authenticate user and create session.

    Returns bearer token and expiration time.
    """
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token, expires_at = create_session(db, user)
    return LoginResponse(token=token, expires_at=expires_at)


@router.post("/logout")
def logout(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> dict:
    """Revoke current session token."""
    revoke_session(db, token)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)) -> UserOut:
    """Get current authenticated user."""
    return UserOut.model_validate(user, from_attributes=True)
