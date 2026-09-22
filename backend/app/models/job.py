from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.jd_analysis import JDAnalysis


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    raw_description: Mapped[str] = mapped_column(Text, nullable=False)

    # 1-to-1 relationship with JDAnalysis
    analysis: Mapped[Optional["JDAnalysis"]] = relationship(
        "JDAnalysis",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
