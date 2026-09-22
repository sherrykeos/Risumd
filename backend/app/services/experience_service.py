from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException
from app.models.experience import Experience
from app.schemas.experience import ExperienceCreate, ExperienceUpdate
from app.services.technology_service import technology_service
from app.services.skill_service import skill_service
from app.services.achievement_service import achievement_service


class ExperienceService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Experience]:
        stmt = (
            select(Experience)
            .order_by(Experience.start_date.desc().nullslast(), Experience.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, experience_id: int) -> Experience:
        stmt = select(Experience).where(Experience.id == experience_id)
        experience = db.scalar(stmt)
        if not experience:
            raise EntityNotFoundException("Experience", experience_id)
        return experience

    @staticmethod
    def create(db: Session, data: ExperienceCreate) -> Experience:
        experience = Experience(
            company=data.company.strip(),
            role=data.role.strip(),
            description=data.description,
            start_date=data.start_date,
            end_date=data.end_date,
            location=data.location.strip() if data.location else None,
        )
        db.add(experience)

        if data.technologies:
            experience.technologies = technology_service.get_or_create_multiple(db, data.technologies)

        if data.skills:
            experience.skills = skill_service.get_or_create_multiple(db, data.skills)

        if data.achievements:
            experience.achievements = achievement_service.resolve_or_create_multiple(db, data.achievements)

        db.commit()
        db.refresh(experience)
        return experience

    @staticmethod
    def update(db: Session, experience_id: int, data: ExperienceUpdate) -> Experience:
        experience = ExperienceService.get_by_id(db, experience_id)

        if data.company is not None:
            experience.company = data.company.strip()
        if data.role is not None:
            experience.role = data.role.strip()
        if data.description is not None:
            experience.description = data.description
        if data.start_date is not None:
            experience.start_date = data.start_date
        if data.end_date is not None:
            experience.end_date = data.end_date
        if data.location is not None:
            experience.location = data.location.strip() if data.location else None

        if data.technologies is not None:
            experience.technologies = technology_service.get_or_create_multiple(db, data.technologies)

        if data.skills is not None:
            experience.skills = skill_service.get_or_create_multiple(db, data.skills)

        if data.achievements is not None:
            experience.achievements = achievement_service.resolve_or_create_multiple(db, data.achievements)

        db.commit()
        db.refresh(experience)
        return experience

    @staticmethod
    def delete(db: Session, experience_id: int) -> None:
        experience = ExperienceService.get_by_id(db, experience_id)
        db.delete(experience)
        db.commit()


experience_service = ExperienceService()
