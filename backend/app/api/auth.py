from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import ValidationException
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

OAUTH_STATE_COOKIE = "risumd_oauth_state"


@router.get("/google/login", summary="Initiate Google OAuth 2.0 flow")
def google_login():
    """
    Redirects user to Google OAuth 2.0 consent screen.
    """
    try:
        auth_url, state = auth_service.generate_google_auth_url()
        response = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
        response.set_cookie(
            key=OAUTH_STATE_COOKIE,
            value=state,
            max_age=600,  # 10 minutes
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite="lax",
            path="/",
        )
        return response
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.get("/google/callback", summary="Google OAuth 2.0 callback")
def google_callback(
    request: Request,
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(None, description="CSRF state parameter"),
    db: Session = Depends(get_db),
):
    """
    Handles redirect from Google OAuth, validates CSRF state, exchanges code for user profile,
    creates user and session, and sets secure HttpOnly session cookie.
    """
    # Verify state cookie if present
    saved_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if saved_state and state and saved_state != state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state parameter (CSRF detected).")

    try:
        google_profile = auth_service.exchange_google_code(code)
        user, session_token = auth_service.authenticate_or_create_user(db, google_profile)

        # Redirect to frontend application
        redirect_url = settings.FRONTEND_URL
        response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

        # Set session cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_token,
            max_age=settings.SESSION_EXPIRE_DAYS * 86400,
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            path="/",
        )
        # Clear oauth state cookie
        response.delete_cookie(key=OAUTH_STATE_COOKIE, path="/")
        return response
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Authentication failed: {str(e)}")


@router.get("/me", response_model=UserResponse, summary="Get currently authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns profile information of the currently authenticated user.
    """
    return current_user


@router.post("/logout", summary="Log out current user")
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revokes the active session and deletes the session cookie.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if token:
        auth_service.revoke_session(db, token)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )
    return {"status": "ok", "message": "Logged out successfully"}
