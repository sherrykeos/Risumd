import os
import re
from pathlib import Path
import sys

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from alembic import command
from app.core.config import settings

def get_test_db_url() -> str:
    if settings.TEST_DATABASE_URL:
        return settings.TEST_DATABASE_URL
    if os.getenv("TEST_DATABASE_URL"):
        return os.environ["TEST_DATABASE_URL"]
    if "postgresql" in settings.DATABASE_URL:
        return re.sub(r"/[^/?]+(\?.*)?$", r"/risumd_test\1", settings.DATABASE_URL)
    return "postgresql+psycopg://postgres:postgres@localhost:5432/risumd_test"

test_url = get_test_db_url()
print(f"Migrating test db at: {test_url}")

alembic_cfg = Config(str(backend_dir / "alembic.ini"))
alembic_cfg.set_main_option("sqlalchemy.url", test_url)
command.upgrade(alembic_cfg, "head")
print("Migration completed successfully!")
