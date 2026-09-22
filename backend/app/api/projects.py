from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)
from app.services.project_service import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse], status_code=status.HTTP_200_OK)
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return project_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
def get_project(id: int, db: Session = Depends(get_db)):
    return project_service.get_by_id(db, id)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    return project_service.create(db, data)


@router.patch("/{id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
def update_project(id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    return project_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, db: Session = Depends(get_db)):
    project_service.delete(db, id)
