from typing import Any, Dict, List, Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.application import Application


class ResumeVersion(Base, TimestampMixin):
    __tablename__ = "resume_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    resume_data: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
    )
    latex_source: Mapped[str] = mapped_column(Text, nullable=False)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="resumes")
    applications: Mapped[List["Application"]] = relationship(
        "Application",
        back_populates="resume_version",
    )

    __table_args__ = (
        UniqueConstraint("job_id", "version_number", name="uq_resume_versions_job_version"),
    )

    @property
    def pdf_available(self) -> bool:
        if not self.pdf_path:
            return False
        from pathlib import Path
        p = Path(self.pdf_path)
        return p.exists() and p.stat().st_size > 0
