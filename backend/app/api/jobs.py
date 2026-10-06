from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.services.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse], status_code=status.HTTP_200_OK)
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return job_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=JobResponse, status_code=status.HTTP_200_OK)
def get_job(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return job_service.get_by_id(db, job_id=id, user_id=current_user.id)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return job_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=JobResponse, status_code=status.HTTP_200_OK)
def update_job(
    id: int,
    data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return job_service.update(db, job_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_service.delete(db, job_id=id, user_id=current_user.id)
