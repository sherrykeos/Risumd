from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.services.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse], status_code=status.HTTP_200_OK)
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return job_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=JobResponse, status_code=status.HTTP_200_OK)
def get_job(id: int, db: Session = Depends(get_db)):
    return job_service.get_by_id(db, id)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(data: JobCreate, db: Session = Depends(get_db)):
    return job_service.create(db, data)


@router.patch("/{id}", response_model=JobResponse, status_code=status.HTTP_200_OK)
def update_job(id: int, data: JobUpdate, db: Session = Depends(get_db)):
    return job_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(id: int, db: Session = Depends(get_db)):
    job_service.delete(db, id)
