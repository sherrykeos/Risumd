"""002_job_and_jd_analysis

Revision ID: 002_job_and_jd_analysis
Revises: 001_initial_career_vault
Create Date: 2026-09-22 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_job_and_jd_analysis"
down_revision: Union[str, None] = "001_initial_career_vault"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create jobs table
    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("raw_description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2. Create jd_analyses table
    jsonb_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")
    op.create_table(
        "jd_analyses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("seniority", sa.String(length=100), nullable=True),
        sa.Column("domain", sa.String(length=100), nullable=True),
        sa.Column("required_skills", jsonb_type, server_default="[]", nullable=False),
        sa.Column("preferred_skills", jsonb_type, server_default="[]", nullable=False),
        sa.Column("technologies", jsonb_type, server_default="[]", nullable=False),
        sa.Column("responsibilities", jsonb_type, server_default="[]", nullable=False),
        sa.Column("keywords", jsonb_type, server_default="[]", nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_id", name="uq_jd_analyses_job_id"),
    )
    op.create_index(op.f("ix_jd_analyses_job_id"), "jd_analyses", ["job_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_jd_analyses_job_id"), table_name="jd_analyses")
    op.drop_table("jd_analyses")
    op.drop_table("jobs")
