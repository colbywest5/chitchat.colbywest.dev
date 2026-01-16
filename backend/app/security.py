import base64
import hashlib
import os
import bcrypt
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .settings import settings
from .models import User, Session as DbSession


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.PASSWORD_BCRYPT_ROUNDS)
    pw = bcrypt.hashpw(password.encode("utf-8"), salt)
    return pw.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _random_token() -> str:
    raw = os.urandom(settings.SESSION_TOKEN_BYTES)
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _hash_token(token: str) -> str:
    h = hashlib.sha256()
    h.update((settings.SECRET_KEY_CHANGE_ME + ":" + token).encode("utf-8"))
    return h.hexdigest()


def create_session(db: Session, user: User) -> tuple[str, datetime]:
    token = _random_token()
    token_hash = _hash_token(token)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_TTL_SECONDS)
    s = DbSession(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(s)
    db.commit()
    return token, expires_at


def get_user_by_session_token(db: Session, token: str) -> User | None:
    token_hash = _hash_token(token)
    s = db.query(DbSession).filter(DbSession.token_hash == token_hash).first()
    if not s:
        return None
    now = datetime.now(timezone.utc)
    if s.expires_at <= now:
        db.delete(s)
        db.commit()
        return None
    return db.query(User).filter(User.id == s.user_id).first()


def revoke_session(db: Session, token: str) -> None:
    token_hash = _hash_token(token)
    s = db.query(DbSession).filter(DbSession.token_hash == token_hash).first()
    if s:
        db.delete(s)
        db.commit()
