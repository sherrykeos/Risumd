from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.services.auth_service import auth_service


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Extracts session token from cookie (or Authorization Bearer header) and resolves User.
    Returns None if not authenticated.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)

    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    return auth_service.get_user_by_session_token(db, token)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Enforces authentication. Raises HTTP 401 if request does not contain a valid session.
    """
    user = get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google.",
            headers={"WWW-Authenticate": "Cookie"},
        )
    return user
