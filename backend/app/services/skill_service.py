from typing import List, Optional, Union
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.exceptions import EntityAlreadyExistsException, EntityNotFoundException
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillUpdate


class SkillService:
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None
    ) -> List[Skill]:
        stmt = select(Skill).order_by(Skill.name.asc())
        if category:
            stmt = stmt.where(func.lower(Skill.category) == func.lower(category.strip()))
        stmt = stmt.offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, skill_id: int) -> Skill:
        stmt = select(Skill).where(Skill.id == skill_id)
        skill = db.scalar(stmt)
        if not skill:
            raise EntityNotFoundException("Skill", skill_id)
        return skill

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Skill]:
        stmt = select(Skill).where(func.lower(Skill.name) == func.lower(name.strip()))
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, data: SkillCreate) -> Skill:
        existing = SkillService.get_by_name(db, data.name)
        if existing:
            raise EntityAlreadyExistsException("Skill", "name", data.name)
        skill = Skill(
            name=data.name.strip(),
            category=data.category.strip() if data.category else None,
            description=data.description,
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)
        return skill

    @staticmethod
    def update(db: Session, skill_id: int, data: SkillUpdate) -> Skill:
        skill = SkillService.get_by_id(db, skill_id)
        if data.name is not None:
            clean_name = data.name.strip()
            existing = SkillService.get_by_name(db, clean_name)
            if existing and existing.id != skill_id:
                raise EntityAlreadyExistsException("Skill", "name", clean_name)
            skill.name = clean_name
        if data.category is not None:
            skill.category = data.category.strip() if data.category else None
        if data.description is not None:
            skill.description = data.description

        db.commit()
        db.refresh(skill)
        return skill

    @staticmethod
    def delete(db: Session, skill_id: int) -> None:
        skill = SkillService.get_by_id(db, skill_id)
        db.delete(skill)
        db.commit()

    @staticmethod
    def get_or_create_multiple(db: Session, identifiers: List[Union[str, int]]) -> List[Skill]:
        result: List[Skill] = []
        seen_ids = set()

        for item in identifiers:
            if isinstance(item, int):
                skill = SkillService.get_by_id(db, item)
            elif isinstance(item, str) and item.isdigit():
                skill = SkillService.get_by_id(db, int(item))
            elif isinstance(item, str):
                name = item.strip()
                if not name:
                    continue
                skill = SkillService.get_by_name(db, name)
                if not skill:
                    skill = Skill(name=name)
                    db.add(skill)
                    db.flush()
            else:
                continue

            if skill.id not in seen_ids:
                seen_ids.add(skill.id)
                result.append(skill)

        return result


skill_service = SkillService()
