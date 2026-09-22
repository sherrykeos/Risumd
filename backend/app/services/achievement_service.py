from datetime import date as dt_date
from typing import Any, Dict, List, Optional, Union
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException, ValidationException
from app.models.achievement import Achievement
from app.schemas.achievement import AchievementCreate, AchievementUpdate, AchievementLinkOrCreate


def _parse_date(raw_date: Any) -> Optional[dt_date]:
    if raw_date is None:
        return None
    if isinstance(raw_date, dt_date):
        return raw_date
    if isinstance(raw_date, str):
        raw_date = raw_date.strip()
        if not raw_date:
            return None
        return dt_date.fromisoformat(raw_date)
    return None


class AchievementService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Achievement]:
        stmt = select(Achievement).order_by(Achievement.created_at.desc()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, achievement_id: int) -> Achievement:
        stmt = select(Achievement).where(Achievement.id == achievement_id)
        achievement = db.scalar(stmt)
        if not achievement:
            raise EntityNotFoundException("Achievement", achievement_id)
        return achievement

    @staticmethod
    def create(db: Session, data: AchievementCreate) -> Achievement:
        achievement = Achievement(
            title=data.title.strip(),
            description=data.description,
            date=_parse_date(data.date),
        )
        db.add(achievement)
        db.commit()
        db.refresh(achievement)
        return achievement

    @staticmethod
    def update(db: Session, achievement_id: int, data: AchievementUpdate) -> Achievement:
        achievement = AchievementService.get_by_id(db, achievement_id)
        if data.title is not None:
            achievement.title = data.title.strip()
        if data.description is not None:
            achievement.description = data.description
        if data.date is not None:
            achievement.date = _parse_date(data.date)

        db.commit()
        db.refresh(achievement)
        return achievement

    @staticmethod
    def delete(db: Session, achievement_id: int) -> None:
        achievement = AchievementService.get_by_id(db, achievement_id)
        db.delete(achievement)
        db.commit()

    @staticmethod
    def resolve_or_create_multiple(
        db: Session,
        items: List[Union[int, AchievementLinkOrCreate, Dict[str, Any], str]]
    ) -> List[Achievement]:
        result: List[Achievement] = []
        seen_ids = set()

        for item in items:
            achievement: Achievement
            if isinstance(item, int):
                achievement = AchievementService.get_by_id(db, item)
            elif isinstance(item, str) and item.isdigit():
                achievement = AchievementService.get_by_id(db, int(item))
            elif isinstance(item, str):
                title = item.strip()
                if not title:
                    continue
                achievement = Achievement(title=title)
                db.add(achievement)
                db.flush()
            elif isinstance(item, AchievementLinkOrCreate):
                if item.id is not None:
                    achievement = AchievementService.get_by_id(db, item.id)
                elif item.title:
                    achievement = Achievement(
                        title=item.title.strip(),
                        description=item.description,
                        date=_parse_date(item.date),
                    )
                    db.add(achievement)
                    db.flush()
                else:
                    raise ValidationException("Achievement must provide an id or title")
            elif isinstance(item, dict):
                if item.get("id") is not None:
                    achievement = AchievementService.get_by_id(db, int(item["id"]))
                elif item.get("title"):
                    achievement = Achievement(
                        title=item["title"].strip(),
                        description=item.get("description"),
                        date=_parse_date(item.get("date")),
                    )
                    db.add(achievement)
                    db.flush()
                else:
                    raise ValidationException("Achievement dict must have id or title")
            else:
                continue

            if achievement.id not in seen_ids:
                seen_ids.add(achievement.id)
                result.append(achievement)

        return result


achievement_service = AchievementService()
