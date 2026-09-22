from sqlalchemy import Column, ForeignKey, Integer, Table
from app.models.base import Base

project_skills = Table(
    "project_skills",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)

project_technologies = Table(
    "project_technologies",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("technology_id", Integer, ForeignKey("technologies.id", ondelete="CASCADE"), primary_key=True),
)

project_achievements = Table(
    "project_achievements",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("achievement_id", Integer, ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True),
)

experience_skills = Table(
    "experience_skills",
    Base.metadata,
    Column("experience_id", Integer, ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)

experience_technologies = Table(
    "experience_technologies",
    Base.metadata,
    Column("experience_id", Integer, ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True),
    Column("technology_id", Integer, ForeignKey("technologies.id", ondelete="CASCADE"), primary_key=True),
)

experience_achievements = Table(
    "experience_achievements",
    Base.metadata,
    Column("experience_id", Integer, ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True),
    Column("achievement_id", Integer, ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True),
)
