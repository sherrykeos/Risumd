from datetime import date as dt_date
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.associations import project_achievements, experience_achievements

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.experience import Experience


class Achievement(Base, TimestampMixin):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[Optional[dt_date]] = mapped_column(Date, nullable=True)

    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        secondary=project_achievements,
        back_populates="achievements",
    )
    experiences: Mapped[List["Experience"]] = relationship(
        "Experience",
        secondary=experience_achievements,
        back_populates="achievements",
    )
