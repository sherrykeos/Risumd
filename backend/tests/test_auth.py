from datetime import datetime, timedelta, timezone
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.session import UserSession
from app.models.user import User


def test_unauthenticated_request_rejected(unauthenticated_client: TestClient):
    # Unauthenticated request without session cookie should receive 401
    res = unauthenticated_client.get("/api/projects")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


def test_auth_me_unauthenticated_returns_401(unauthenticated_client: TestClient):
    res = unauthenticated_client.get("/api/auth/me")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


def test_google_login_redirect_url(unauthenticated_client: TestClient):
    res = unauthenticated_client.get("/api/auth/google/login", follow_redirects=False)
    assert res.status_code in [302, 307]
    location = res.headers["location"]
    assert "accounts.google.com/o/oauth2/v2/auth" in location
    assert "client_id=" in location
    assert "scope=" in location


def test_google_callback_creates_user_and_session(unauthenticated_client: TestClient, db_session: Session):
    mock_profile = {
        "sub": "google_sub_new_user_123",
        "email": "newuser@example.com",
        "name": "New Google User",
        "picture": "https://example.com/photo.jpg",
    }

    with patch("app.services.auth_service.auth_service.exchange_google_code", return_value=mock_profile):
        res = unauthenticated_client.get("/api/auth/google/callback?code=mock_code&state=mock_state", follow_redirects=False)

    assert res.status_code in [302, 307]
    # Redirect to frontend
    assert res.headers["location"] == settings.FRONTEND_URL
    # Set-cookie for session
    cookies = res.cookies
    assert settings.SESSION_COOKIE_NAME in cookies
    session_token = cookies[settings.SESSION_COOKIE_NAME]

    # Verify user exists in database
    created_user = db_session.query(User).filter(User.google_sub == "google_sub_new_user_123").first()
    assert created_user is not None
    assert created_user.email == "newuser@example.com"
    assert created_user.name == "New Google User"

    # Verify session exists in database
    session_record = db_session.query(UserSession).filter(UserSession.session_token == session_token).first()
    assert session_record is not None
    assert session_record.user_id == created_user.id
    assert session_record.expires_at > datetime.now(timezone.utc)

    # Use session cookie to make authenticated request
    unauthenticated_client.cookies.set(settings.SESSION_COOKIE_NAME, session_token)
    me_res = unauthenticated_client.get("/api/auth/me")
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "newuser@example.com"
    assert me_data["name"] == "New Google User"


def test_logout_revokes_session(unauthenticated_client: TestClient, db_session: Session):
    # 1. Create a user and session
    user = User(
        google_sub="sub_to_logout",
        email="logout_test@example.com",
        name="Logout Tester",
    )
    db_session.add(user)
    db_session.commit()

    session_token = "valid_session_token_to_logout"
    user_session = UserSession(
        session_token=session_token,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(user_session)
    db_session.commit()

    # 2. Authenticate client with session cookie
    unauthenticated_client.cookies.set(settings.SESSION_COOKIE_NAME, session_token)

    # Verify access works
    res_before = unauthenticated_client.get("/api/auth/me")
    assert res_before.status_code == 200
    assert res_before.json()["email"] == "logout_test@example.com"

    # 3. Call logout
    logout_res = unauthenticated_client.post("/api/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "ok"

    # Verify session deleted from database
    db_session.expire_all()
    deleted_session = db_session.query(UserSession).filter(UserSession.session_token == session_token).first()
    assert deleted_session is None

    # Clear cookie from client and verify access is rejected
    unauthenticated_client.cookies.clear()
    proj_res = unauthenticated_client.get("/api/projects")
    assert proj_res.status_code == 401


def test_expired_session_rejected(unauthenticated_client: TestClient, db_session: Session):
    user = User(
        google_sub="sub_expired",
        email="expired@example.com",
        name="Expired User",
    )
    db_session.add(user)
    db_session.commit()

    # Create expired session
    expired_token = "expired_session_token"
    user_session = UserSession(
        session_token=expired_token,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db_session.add(user_session)
    db_session.commit()

    unauthenticated_client.cookies.set(settings.SESSION_COOKIE_NAME, expired_token)
    res = unauthenticated_client.get("/api/projects")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]
