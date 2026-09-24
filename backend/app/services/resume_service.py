import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import EntityNotFoundException, JobAnalysisMissingException, LaTeXCompilationError
from app.models.job import Job
from app.models.resume_version import ResumeVersion
from app.matching.types import JobMatchResponse
from app.services.matching_service import matching_service
from app.resume.composer import compose_resume
from app.resume.renderer import compile_pdf, render_latex
from app.resume.schemas import ResumeGenerateRequest

logger = logging.getLogger(__name__)


class ResumeService:
    @staticmethod
    def generate_resume(
        db: Session,
        job_id: int,
        overrides: Optional[ResumeGenerateRequest] = None,
        skip_ai: bool = False,
    ) -> ResumeVersion:
        """
        Orchestrates full resume generation pipeline:
        Job -> JDAnalysis -> Matching -> Composition -> AI Refinement -> LaTeX -> PDF -> ResumeVersion
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise EntityNotFoundException("Job", job_id)

        if not job.analysis:
            raise JobAnalysisMissingException(job_id)

        # Calculate version number (increment max or start at 1)
        max_ver = (
            db.query(func.max(ResumeVersion.version_number))
            .filter(ResumeVersion.job_id == job_id)
            .scalar()
        ) or 0
        next_version_number = max_ver + 1

        # 1. Fetch matches from deterministic matching engine
        matches: JobMatchResponse = matching_service.get_job_matches(db, job_id)

        # 2. Compose structured resume data
        resume_data = compose_resume(
            db=db,
            job=job,
            job_analysis=job.analysis,
            matches=matches,
            overrides=overrides,
            skip_ai=skip_ai,
        )

        # 3. Render LaTeX template
        latex_source = render_latex(resume_data)

        # 4. Storage directory setup
        version_dir = settings.STORAGE_DIR / "resumes" / f"job_{job_id}_v{next_version_number}"

        # 5. Compile PDF (raises LaTeXCompilationError if compilation fails)
        pdf_path_str: Optional[str] = None
        try:
            pdf_file = compile_pdf(latex_source=latex_source, output_dir=version_dir)
            pdf_path_str = str(pdf_file)
        except LaTeXCompilationError as e:
            logger.error(f"Failed to compile PDF for job {job_id} version {next_version_number}: {e}")
            raise

        # 6. Save ResumeVersion record to DB
        resume_version = ResumeVersion(
            job_id=job.id,
            version_number=next_version_number,
            resume_data=resume_data.model_dump(),
            latex_source=latex_source,
            pdf_path=pdf_path_str,
        )
        db.add(resume_version)
        db.commit()
        db.refresh(resume_version)

        return resume_version

    @staticmethod
    def get_resume(db: Session, resume_id: int) -> ResumeVersion:
        resume = db.query(ResumeVersion).filter(ResumeVersion.id == resume_id).first()
        if not resume:
            raise EntityNotFoundException("ResumeVersion", resume_id)
        return resume

    @staticmethod
    def list_resumes(db: Session, job_id: Optional[int] = None) -> List[ResumeVersion]:
        query = db.query(ResumeVersion)
        if job_id is not None:
            query = query.filter(ResumeVersion.job_id == job_id)
        return query.order_by(ResumeVersion.created_at.desc(), ResumeVersion.version_number.desc()).all()

    @staticmethod
    def get_resume_pdf_path(db: Session, resume_id: int) -> Path:
        resume = db.query(ResumeVersion).filter(ResumeVersion.id == resume_id).first()
        if not resume:
            raise EntityNotFoundException("ResumeVersion", resume_id)

        if not resume.pdf_path:
            raise FileNotFoundError(f"PDF file has not been generated for resume version {resume_id}")

        pdf_path = Path(resume.pdf_path)
        if not pdf_path.exists() or pdf_path.stat().st_size == 0:
            raise FileNotFoundError(f"PDF file on disk is missing for resume version {resume_id} at {resume.pdf_path}")

        return pdf_path


resume_service = ResumeService()
