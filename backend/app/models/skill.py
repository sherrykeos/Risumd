from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.associations import project_skills, experience_skills

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project
    from app.models.experience import Experience


class Skill(Base, TimestampMixin):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        secondary=project_skills,
        back_populates="skills",
    )
    experiences: Mapped[List["Experience"]] = relationship(
        "Experience",
        secondary=experience_skills,
        back_populates="skills",
    )
    user: Mapped["User"] = relationship("User", back_populates="skills")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_skills_user_name"),
    )
