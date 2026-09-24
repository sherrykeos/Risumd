from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException, JobAnalysisMissingException, LaTeXCompilationError
from app.db.database import get_db
from app.resume.schemas import ResumeGenerateRequest, ResumeVersionResponse
from app.services.resume_service import resume_service

router = APIRouter()


@router.post(
    "/jobs/{id}/resume/generate",
    response_model=ResumeVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a tailored, versioned resume for a target job",
    description="Selects Career Vault evidence, polishes wording via Gemini, compiles LaTeX/PDF, and persists an immutable ResumeVersion.",
)
def generate_resume_endpoint(
    id: int,
    overrides: Optional[ResumeGenerateRequest] = None,
    skip_ai: bool = Query(False, description="Set to true to skip Gemini refinement and use raw vault text"),
    db: Session = Depends(get_db),
):
    try:
        version = resume_service.generate_resume(
            db=db,
            job_id=id,
            overrides=overrides,
            skip_ai=skip_ai,
        )
        return version
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except JobAnalysisMissingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except LaTeXCompilationError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF Compilation Failed: {e.message}")


@router.get(
    "/jobs/{id}/resumes",
    response_model=List[ResumeVersionResponse],
    summary="Get all generated resume versions for a specific job",
)
def get_job_resumes_endpoint(id: int, db: Session = Depends(get_db)):
    return resume_service.list_resumes(db=db, job_id=id)


@router.get(
    "/resumes",
    response_model=List[ResumeVersionResponse],
    summary="List all resume versions",
)
def list_resumes_endpoint(
    job_id: Optional[int] = Query(None, description="Optional job ID filter"),
    db: Session = Depends(get_db),
):
    return resume_service.list_resumes(db=db, job_id=job_id)


@router.get(
    "/resumes/{id}",
    response_model=ResumeVersionResponse,
    summary="Get details of a specific resume version",
)
def get_resume_endpoint(id: int, db: Session = Depends(get_db)):
    try:
        return resume_service.get_resume(db=db, resume_id=id)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get(
    "/resumes/{id}/pdf",
    summary="Download or stream the generated PDF for a resume version",
)
def get_resume_pdf_endpoint(id: int, db: Session = Depends(get_db)):
    try:
        pdf_path = resume_service.get_resume_pdf_path(db=db, resume_id=id)
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=f"resume_v{id}.pdf",
        )
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
