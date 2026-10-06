"""004_auth_and_multi_user

Revision ID: 004_auth_and_multi_user
Revises: 003_resume_and_applications
Create Date: 2026-10-06 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004_auth_and_multi_user"
down_revision: Union[str, None] = "003_resume_and_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("google_sub", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_google_sub"), "users", ["google_sub"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    # 2. Create user_sessions table
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_sessions_user_id"), "user_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_sessions_session_token"), "user_sessions", ["session_token"], unique=True)

    # 3. Insert bootstrap user to claim existing orphaned data safely
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO users (google_sub, email, name, avatar_url, created_at, updated_at) "
            "VALUES ('bootstrap_owner', 'candidate@example.com', 'Sherry', NULL, NOW(), NOW())"
        )
    )

    # 4. Add user_id column to user-owned tables
    tables = [
        "projects",
        "experiences",
        "education",
        "achievements",
        "skills",
        "technologies",
        "jobs",
        "resume_versions",
        "applications",
    ]

    for table in tables:
        # Add column as nullable initially
        op.add_column(table, sa.Column("user_id", sa.Integer(), nullable=True))

        # Backfill existing rows with bootstrap owner id
        conn.execute(
            sa.text(
                f"UPDATE {table} SET user_id = (SELECT id FROM users WHERE google_sub = 'bootstrap_owner' LIMIT 1) "
                f"WHERE user_id IS NULL"
            )
        )

        # Alter to NOT NULL
        op.alter_column(table, "user_id", nullable=False)

        # Add foreign key and index
        op.create_foreign_key(
            f"fk_{table}_user_id_users",
            table,
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index(op.f(f"ix_{table}_user_id"), table, ["user_id"], unique=False)

    # 5. Fix skills and technologies unique constraints (per-user unique rather than global)
    op.drop_index("ix_skills_name", table_name="skills")
    op.create_index(op.f("ix_skills_name"), "skills", ["name"], unique=False)
    op.create_unique_constraint("uq_skills_user_name", "skills", ["user_id", "name"])

    op.drop_index("ix_technologies_name", table_name="technologies")
    op.create_index(op.f("ix_technologies_name"), "technologies", ["name"], unique=False)
    op.create_unique_constraint("uq_technologies_user_name", "technologies", ["user_id", "name"])


def downgrade() -> None:
    # Drop per-user unique constraints and restore global unique index
    op.drop_constraint("uq_technologies_user_name", "technologies", type_="unique")
    op.drop_index(op.f("ix_technologies_name"), table_name="technologies")
    op.create_index("ix_technologies_name", "technologies", ["name"], unique=True)

    op.drop_constraint("uq_skills_user_name", "skills", type_="unique")
    op.drop_index(op.f("ix_skills_name"), table_name="skills")
    op.create_index("ix_skills_name", "skills", ["name"], unique=True)

    tables = [
        "applications",
        "resume_versions",
        "jobs",
        "technologies",
        "skills",
        "achievements",
        "education",
        "experiences",
        "projects",
    ]

    for table in tables:
        op.drop_index(op.f(f"ix_{table}_user_id"), table_name=table)
        op.drop_constraint(f"fk_{table}_user_id_users", table, type_="foreignkey")
        op.drop_column(table, "user_id")

    op.drop_index(op.f("ix_user_sessions_session_token"), table_name="user_sessions")
    op.drop_index(op.f("ix_user_sessions_user_id"), table_name="user_sessions")
    op.drop_table("user_sessions")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_google_sub"), table_name="users")
    op.drop_table("users")
