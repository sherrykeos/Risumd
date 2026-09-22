from datetime import date
from typing import List, Optional
from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.associations import project_skills, project_technologies, project_achievements


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    live_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Normalized relationships
    skills: Mapped[List["Skill"]] = relationship(
        "Skill",
        secondary=project_skills,
        back_populates="projects",
        lazy="selectin",
    )
    technologies: Mapped[List["Technology"]] = relationship(
        "Technology",
        secondary=project_technologies,
        back_populates="projects",
        lazy="selectin",
    )
    achievements: Mapped[List["Achievement"]] = relationship(
        "Achievement",
        secondary=project_achievements,
        back_populates="projects",
        lazy="selectin",
    )
