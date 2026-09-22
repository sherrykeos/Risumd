from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityAlreadyExistsException, EntityNotFoundException
from app.models.jd_analysis import JDAnalysis
from app.schemas.jd_analysis import JDAnalysisCreate, JDAnalysisUpdate
from app.services.job_service import job_service


class JDAnalysisService:
    @staticmethod
    def get_by_job_id(db: Session, job_id: int) -> JDAnalysis:
        # Validate that the parent job exists
        job_service.get_by_id(db, job_id)

        stmt = select(JDAnalysis).where(JDAnalysis.job_id == job_id)
        analysis = db.scalar(stmt)
        if not analysis:
            raise EntityNotFoundException("JDAnalysis for Job", job_id)
        return analysis

    @staticmethod
    def create(db: Session, job_id: int, data: JDAnalysisCreate) -> JDAnalysis:
        # Validate that the parent job exists
        job_service.get_by_id(db, job_id)

        # Enforce one analysis per job
        stmt = select(JDAnalysis).where(JDAnalysis.job_id == job_id)
        existing = db.scalar(stmt)
        if existing:
            raise EntityAlreadyExistsException("JDAnalysis", "job_id", job_id)

        analysis = JDAnalysis(
            job_id=job_id,
            seniority=data.seniority.strip() if data.seniority else None,
            domain=data.domain.strip() if data.domain else None,
            required_skills=data.required_skills or [],
            preferred_skills=data.preferred_skills or [],
            technologies=data.technologies or [],
            responsibilities=data.responsibilities or [],
            keywords=data.keywords or [],
            summary=data.summary.strip() if data.summary else None,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def update(db: Session, job_id: int, data: JDAnalysisUpdate) -> JDAnalysis:
        analysis = JDAnalysisService.get_by_job_id(db, job_id)

        if data.seniority is not None:
            analysis.seniority = data.seniority.strip() if data.seniority else None
        if data.domain is not None:
            analysis.domain = data.domain.strip() if data.domain else None
        if data.required_skills is not None:
            analysis.required_skills = data.required_skills
        if data.preferred_skills is not None:
            analysis.preferred_skills = data.preferred_skills
        if data.technologies is not None:
            analysis.technologies = data.technologies
        if data.responsibilities is not None:
            analysis.responsibilities = data.responsibilities
        if data.keywords is not None:
            analysis.keywords = data.keywords
        if data.summary is not None:
            analysis.summary = data.summary.strip() if data.summary else None

        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def delete(db: Session, job_id: int) -> None:
        analysis = JDAnalysisService.get_by_job_id(db, job_id)
        db.delete(analysis)
        db.commit()


jd_analysis_service = JDAnalysisService()
