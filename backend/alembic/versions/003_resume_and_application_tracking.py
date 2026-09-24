"""003_resume_and_application_tracking

Revision ID: 003_resume_and_applications
Revises: 002_job_and_jd_analysis
Create Date: 2026-09-23 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003_resume_and_applications"
down_revision: Union[str, None] = "002_job_and_jd_analysis"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    jsonb_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")

    # 1. Create resume_versions table
    op.create_table(
        "resume_versions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("resume_data", jsonb_type, nullable=False),
        sa.Column("latex_source", sa.Text(), nullable=False),
        sa.Column("pdf_path", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_id", "version_number", name="uq_resume_versions_job_version"),
    )
    op.create_index(op.f("ix_resume_versions_job_id"), "resume_versions", ["job_id"], unique=False)

    # 2. Create applications table
    app_status_enum = sa.Enum(
        "DRAFT",
        "APPLIED",
        "SCREENING",
        "INTERVIEW",
        "OFFER",
        "REJECTED",
        "WITHDRAWN",
        name="application_status_enum",
        native_enum=False,
    )
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("resume_version_id", sa.Integer(), nullable=False),
        sa.Column("status", app_status_enum, nullable=False, server_default="APPLIED"),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_version_id"], ["resume_versions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_applications_job_id"), "applications", ["job_id"], unique=False)
    op.create_index(op.f("ix_applications_resume_version_id"), "applications", ["resume_version_id"], unique=False)

    # 3. Create application_status_history table
    op.create_table(
        "application_status_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("old_status", sa.String(length=50), nullable=True),
        sa.Column("new_status", sa.String(length=50), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_application_status_history_application_id"),
        "application_status_history",
        ["application_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_application_status_history_application_id"), table_name="application_status_history")
    op.drop_table("application_status_history")

    op.drop_index(op.f("ix_applications_resume_version_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_job_id"), table_name="applications")
    op.drop_table("applications")

    op.drop_index(op.f("ix_resume_versions_job_id"), table_name="resume_versions")
    op.drop_table("resume_versions")
