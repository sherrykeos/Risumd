from datetime import date
from typing import List, Optional
from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.associations import experience_skills, experience_technologies, experience_achievements


class Experience(Base, TimestampMixin):
    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Normalized relationships
    skills: Mapped[List["Skill"]] = relationship(
        "Skill",
        secondary=experience_skills,
        back_populates="experiences",
        lazy="selectin",
    )
    technologies: Mapped[List["Technology"]] = relationship(
        "Technology",
        secondary=experience_technologies,
        back_populates="experiences",
        lazy="selectin",
    )
    achievements: Mapped[List["Achievement"]] = relationship(
        "Achievement",
        secondary=experience_achievements,
        back_populates="experiences",
        lazy="selectin",
    )
