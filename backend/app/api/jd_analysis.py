from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.jd_analysis import (
    JDAnalysisCreate,
    JDAnalysisUpdate,
    JDAnalysisResponse,
)
from app.services.jd_analysis_service import jd_analysis_service

router = APIRouter(prefix="/jobs/{id}/analysis", tags=["JD Analysis"])


@router.get("", response_model=JDAnalysisResponse, status_code=status.HTTP_200_OK)
def get_job_analysis(id: int, db: Session = Depends(get_db)):
    return jd_analysis_service.get_by_job_id(db, id)


@router.post("", response_model=JDAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_job_analysis(id: int, data: JDAnalysisCreate, db: Session = Depends(get_db)):
    return jd_analysis_service.create(db, id, data)


@router.post(
    "/generate",
    response_model=JDAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate structured JD analysis using Gemini AI",
)
def generate_job_analysis(id: int, db: Session = Depends(get_db)):
    return jd_analysis_service.generate_analysis(db, id)


@router.patch("", response_model=JDAnalysisResponse, status_code=status.HTTP_200_OK)
def update_job_analysis(id: int, data: JDAnalysisUpdate, db: Session = Depends(get_db)):
    return jd_analysis_service.update(db, id, data)



@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_analysis(id: int, db: Session = Depends(get_db)):
    jd_analysis_service.delete(db, id)
