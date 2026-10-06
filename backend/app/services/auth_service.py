import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ValidationException
from app.models.session import UserSession
from app.models.user import User

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class AuthService:
    @staticmethod
    def generate_google_auth_url() -> Tuple[str, str]:
        """
        Generates Google OAuth 2.0 authorization URL and random CSRF state parameter.
        """
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationException("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID.")

        state = secrets.token_urlsafe(32)
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
        return url, state

    @staticmethod
    def exchange_google_code(code: str) -> dict:
        """
        Exchanges authorization code for tokens and retrieves user profile from Google.
        """
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValidationException("Google OAuth credentials missing on backend.")

        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        with httpx.Client(timeout=10.0) as client:
            token_resp = client.post(GOOGLE_TOKEN_URL, data=data)
            if token_resp.status_code != 200:
                logger.error(f"Google token exchange failed: {token_resp.text}")
                raise ValidationException("Failed to exchange code with Google.")

            tokens = token_resp.json()
            access_token = tokens.get("access_token")
            if not access_token:
                raise ValidationException("No access token returned by Google.")

            userinfo_resp = client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                logger.error(f"Failed to fetch Google userinfo: {userinfo_resp.text}")
                raise ValidationException("Failed to retrieve profile from Google.")

            return userinfo_resp.json()

    @staticmethod
    def authenticate_or_create_user(db: Session, google_profile: dict) -> Tuple[User, str]:
        """
        Upserts User record based on stable google_sub and generates a secure session token.
        """
        sub = google_profile.get("sub")
        email = google_profile.get("email")
        name = google_profile.get("name") or email or "Risumd User"
        avatar_url = google_profile.get("picture")

        if not sub or not email:
            raise ValidationException("Invalid user profile returned from Google OAuth.")

        stmt = select(User).where(User.google_sub == sub)
        user = db.scalar(stmt)

        if user:
            # Update profile info
            user.email = email
            user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
        else:
            user = User(
                google_sub=sub,
                email=email,
                name=name,
                avatar_url=avatar_url,
            )
            db.add(user)

        db.flush()

        # Create session token
        session_token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

        session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()
        db.refresh(user)

        logger.info(f"User authenticated successfully via Google OAuth: ID {user.id}")
        return user, session_token

    @staticmethod
    def get_user_by_session_token(db: Session, token: Optional[str]) -> Optional[User]:
        if not token:
            return None

        stmt = (
            select(UserSession)
            .where(
                UserSession.session_token == token,
                UserSession.expires_at > datetime.now(timezone.utc),
            )
        )
        session = db.scalar(stmt)
        if not session:
            return None

        return session.user

    @staticmethod
    def revoke_session(db: Session, token: Optional[str]) -> None:
        if not token:
            return

        stmt = select(UserSession).where(UserSession.session_token == token)
        session = db.scalar(stmt)
        if session:
            db.delete(session)
            db.commit()


auth_service = AuthService()
