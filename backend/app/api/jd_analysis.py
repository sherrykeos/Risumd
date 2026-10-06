from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.jd_analysis import (
    JDAnalysisCreate,
    JDAnalysisUpdate,
    JDAnalysisResponse,
)
from app.services.jd_analysis_service import jd_analysis_service

router = APIRouter(prefix="/jobs/{id}/analysis", tags=["JD Analysis"])


@router.get("", response_model=JDAnalysisResponse, status_code=status.HTTP_200_OK)
def get_job_analysis(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return jd_analysis_service.get_by_job_id(db, job_id=id, user_id=current_user.id)


@router.post("", response_model=JDAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_job_analysis(
    id: int,
    data: JDAnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return jd_analysis_service.create(db, job_id=id, user_id=current_user.id, data=data)


@router.post(
    "/generate",
    response_model=JDAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate structured JD analysis using Gemini AI",
)
def generate_job_analysis(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return jd_analysis_service.generate_analysis(db, job_id=id, user_id=current_user.id)


@router.patch("", response_model=JDAnalysisResponse, status_code=status.HTTP_200_OK)
def update_job_analysis(
    id: int,
    data: JDAnalysisUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return jd_analysis_service.update(db, job_id=id, user_id=current_user.id, data=data)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_analysis(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    jd_analysis_service.delete(db, job_id=id, user_id=current_user.id)
