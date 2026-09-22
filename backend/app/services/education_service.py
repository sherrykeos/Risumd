from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException
from app.models.education import Education
from app.schemas.education import EducationCreate, EducationUpdate


class EducationService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Education]:
        stmt = select(Education).order_by(Education.start_date.desc().nullslast()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, education_id: int) -> Education:
        stmt = select(Education).where(Education.id == education_id)
        education = db.scalar(stmt)
        if not education:
            raise EntityNotFoundException("Education", education_id)
        return education

    @staticmethod
    def create(db: Session, data: EducationCreate) -> Education:
        education = Education(
            institution=data.institution.strip(),
            degree=data.degree.strip(),
            field=data.field.strip() if data.field else None,
            start_date=data.start_date,
            end_date=data.end_date,
            grade=data.grade.strip() if data.grade else None,
            description=data.description,
        )
        db.add(education)
        db.commit()
        db.refresh(education)
        return education

    @staticmethod
    def update(db: Session, education_id: int, data: EducationUpdate) -> Education:
        education = EducationService.get_by_id(db, education_id)
        if data.institution is not None:
            education.institution = data.institution.strip()
        if data.degree is not None:
            education.degree = data.degree.strip()
        if data.field is not None:
            education.field = data.field.strip() if data.field else None
        if data.start_date is not None:
            education.start_date = data.start_date
        if data.end_date is not None:
            education.end_date = data.end_date
        if data.grade is not None:
            education.grade = data.grade.strip() if data.grade else None
        if data.description is not None:
            education.description = data.description

        db.commit()
        db.refresh(education)
        return education

    @staticmethod
    def delete(db: Session, education_id: int) -> None:
        education = EducationService.get_by_id(db, education_id)
        db.delete(education)
        db.commit()


education_service = EducationService()
