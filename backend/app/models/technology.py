from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.associations import project_technologies, experience_technologies

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project
    from app.models.experience import Experience


class Technology(Base, TimestampMixin):
    __tablename__ = "technologies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        secondary=project_technologies,
        back_populates="technologies",
    )
    experiences: Mapped[List["Experience"]] = relationship(
        "Experience",
        secondary=experience_technologies,
        back_populates="technologies",
    )
    user: Mapped["User"] = relationship("User", back_populates="technologies")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_technologies_user_name"),
    )
