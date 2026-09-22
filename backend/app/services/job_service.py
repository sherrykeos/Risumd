from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
        stmt = select(Job).order_by(Job.created_at.desc()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, job_id: int) -> Job:
        stmt = select(Job).where(Job.id == job_id)
        job = db.scalar(stmt)
        if not job:
            raise EntityNotFoundException("Job", job_id)
        return job

    @staticmethod
    def create(db: Session, data: JobCreate) -> Job:
        job = Job(
            company=data.company.strip(),
            title=data.title.strip(),
            location=data.location.strip() if data.location else None,
            source_url=data.source_url,
            raw_description=data.raw_description.strip(),
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update(db: Session, job_id: int, data: JobUpdate) -> Job:
        job = JobService.get_by_id(db, job_id)

        if data.company is not None:
            job.company = data.company.strip()
        if data.title is not None:
            job.title = data.title.strip()
        if data.location is not None:
            job.location = data.location.strip() if data.location else None
        if data.source_url is not None:
            job.source_url = data.source_url
        if data.raw_description is not None:
            job.raw_description = data.raw_description.strip()

        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def delete(db: Session, job_id: int) -> None:
        job = JobService.get_by_id(db, job_id)
        db.delete(job)
        db.commit()


job_service = JobService()
