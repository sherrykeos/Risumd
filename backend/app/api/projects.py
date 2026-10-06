from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
def get_project(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.get_by_id(db, project_id=id, user_id=current_user.id)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
def update_project(
    id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.update(db, project_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service.delete(db, project_id=id, user_id=current_user.id)
