import os
from pathlib import Path
import re
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.db.database import get_db, engine as dev_engine
from app.main import app
from app.models.base import Base
import app.models as _registered_models


def get_test_db_url() -> str:
    if settings.TEST_DATABASE_URL:
        return settings.TEST_DATABASE_URL
    if os.getenv("TEST_DATABASE_URL"):
        return os.environ["TEST_DATABASE_URL"]
    if "postgresql" in settings.DATABASE_URL:
        return re.sub(r"/[^/?]+(\?.*)?$", r"/risumd_test\1", settings.DATABASE_URL)
    return "postgresql+psycopg://postgres:postgres@localhost:5432/risumd_test"


TEST_DATABASE_URL = get_test_db_url()

test_engine = create_engine(
    TEST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=60,
)

# Safety check: Ensure tests NEVER run against the development database
if (
    test_engine.url.database == dev_engine.url.database
    and test_engine.url.host == dev_engine.url.host
    and test_engine.url.port == dev_engine.url.port
):
    raise RuntimeError(
        f"TEST DATABASE SAFETY CHECK FAILED: Test database '{test_engine.url.database}' "
        f"matches development database. Tests must use a separate database (e.g. risumd_test)."
    )

from app.api.deps import get_current_user
from app.models.user import User
from app.models.session import UserSession

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Tables to truncate between tests (in proper cascade order)
TRUNCATE_QUERY = text(
    "TRUNCATE TABLE users, user_sessions, "
    "projects, experiences, skills, technologies, achievements, education, "
    "project_skills, project_technologies, project_achievements, "
    "experience_skills, experience_technologies, experience_achievements, "
    "jobs, jd_analyses, resume_versions, applications, application_status_history "
    "RESTART IDENTITY CASCADE;"
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure test database is initialized."""
    yield


# Ensure mock Google credentials for testing OAuth routes
if not settings.GOOGLE_CLIENT_ID:
    settings.GOOGLE_CLIENT_ID = "mock_test_google_client_id"
if not settings.GOOGLE_CLIENT_SECRET:
    settings.GOOGLE_CLIENT_SECRET = "mock_test_google_client_secret"

@pytest.fixture(scope="function")
def db_session():
    """Provides a clean database session per test function with truncated tables and a default test user."""
    with test_engine.begin() as conn:
        conn.execute(TRUNCATE_QUERY)

    session = TestingSessionLocal()
    try:
        # Create default test user (PostgreSQL sequence assigns id=1)
        default_user = User(
            google_sub="test_google_sub_default",
            email="testuser@example.com",
            name="Test User",
            avatar_url="https://example.com/avatar.png",
        )
        session.add(default_user)
        session.commit()
        session.refresh(default_user)
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def default_user(db_session):
    return db_session.query(User).filter(User.google_sub == "test_google_sub_default").first()


@pytest.fixture(scope="function")
def client(db_session, default_user):
    """Provides a TestClient authenticated as default_user."""
    def override_get_current_user():
        return default_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture(scope="function")
def unauthenticated_client(db_session):
    """Provides a TestClient with no auth dependency override (will require valid session cookie)."""
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as c:
        yield c


