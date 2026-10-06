from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.session import UserSession
    from app.models.project import Project
    from app.models.experience import Experience
    from app.models.education import Education
    from app.models.achievement import Achievement
    from app.models.skill import Skill
    from app.models.technology import Technology
    from app.models.job import Job
    from app.models.resume_version import ResumeVersion
    from app.models.application import Application


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    google_sub: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    experiences: Mapped[List["Experience"]] = relationship(
        "Experience",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    education: Mapped[List["Education"]] = relationship(
        "Education",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    achievements: Mapped[List["Achievement"]] = relationship(
        "Achievement",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    skills: Mapped[List["Skill"]] = relationship(
        "Skill",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    technologies: Mapped[List["Technology"]] = relationship(
        "Technology",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    resumes: Mapped[List["ResumeVersion"]] = relationship(
        "ResumeVersion",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    applications: Mapped[List["Application"]] = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
    )
