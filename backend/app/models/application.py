from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ApplicationStatus

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.resume_version import ResumeVersion
    from app.models.application_status_history import ApplicationStatusHistory


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_version_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("resume_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status_enum", native_enum=False),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="applications")
    resume_version: Mapped["ResumeVersion"] = relationship("ResumeVersion", back_populates="applications")
    status_history: Mapped[List["ApplicationStatusHistory"]] = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationStatusHistory.changed_at.desc()",
    )
