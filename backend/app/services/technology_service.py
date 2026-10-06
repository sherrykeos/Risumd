from typing import List, Optional, Union
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.core.exceptions import EntityAlreadyExistsException, EntityNotFoundException
from app.models.technology import Technology
from app.schemas.technology import TechnologyCreate, TechnologyUpdate


class TechnologyService:
    @staticmethod
    def get_all(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Technology]:
        stmt = (
            select(Technology)
            .where(Technology.user_id == user_id)
            .order_by(Technology.name.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, tech_id: int, user_id: int) -> Technology:
        stmt = select(Technology).where(
            and_(Technology.id == tech_id, Technology.user_id == user_id)
        )
        tech = db.scalar(stmt)
        if not tech:
            raise EntityNotFoundException("Technology", tech_id)
        return tech

    @staticmethod
    def get_by_name(db: Session, name: str, user_id: int) -> Optional[Technology]:
        stmt = select(Technology).where(
            and_(
                func.lower(Technology.name) == func.lower(name.strip()),
                Technology.user_id == user_id,
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, user_id: int, data: TechnologyCreate) -> Technology:
        existing = TechnologyService.get_by_name(db, data.name, user_id)
        if existing:
            raise EntityAlreadyExistsException("Technology", "name", data.name)
        tech = Technology(
            user_id=user_id,
            name=data.name.strip(),
            description=data.description,
        )
        db.add(tech)
        db.commit()
        db.refresh(tech)
        return tech

    @staticmethod
    def update(db: Session, tech_id: int, user_id: int, data: TechnologyUpdate) -> Technology:
        tech = TechnologyService.get_by_id(db, tech_id, user_id)
        if data.name is not None:
            clean_name = data.name.strip()
            existing = TechnologyService.get_by_name(db, clean_name, user_id)
            if existing and existing.id != tech_id:
                raise EntityAlreadyExistsException("Technology", "name", clean_name)
            tech.name = clean_name
        if data.description is not None:
            tech.description = data.description

        db.commit()
        db.refresh(tech)
        return tech

    @staticmethod
    def delete(db: Session, tech_id: int, user_id: int) -> None:
        tech = TechnologyService.get_by_id(db, tech_id, user_id)
        db.delete(tech)
        db.commit()

    @staticmethod
    def get_or_create_multiple(db: Session, user_id: int, identifiers: List[Union[str, int]]) -> List[Technology]:
        result: List[Technology] = []
        seen_ids = set()

        for item in identifiers:
            if isinstance(item, int):
                tech = TechnologyService.get_by_id(db, item, user_id)
            elif isinstance(item, str) and item.isdigit():
                tech = TechnologyService.get_by_id(db, int(item), user_id)
            elif isinstance(item, str):
                name = item.strip()
                if not name:
                    continue
                tech = TechnologyService.get_by_name(db, name, user_id)
                if not tech:
                    tech = Technology(user_id=user_id, name=name)
                    db.add(tech)
                    db.flush()
            else:
                continue

            if tech.id not in seen_ids:
                seen_ids.add(tech.id)
                result.append(tech)

        return result


technology_service = TechnologyService()
