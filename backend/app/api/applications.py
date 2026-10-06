from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundException, ValidationException
from app.db.database import get_db
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services.application_service import application_service

router = APIRouter()


@router.get(
    "/applications",
    response_model=List[ApplicationResponse],
    summary="List all job applications with status and history",
)
def list_applications_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return application_service.list_applications(db=db, user_id=current_user.id)


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job application linking a Job and exact ResumeVersion",
)
def create_application_endpoint(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return application_service.create_application(db=db, user_id=current_user.id, data=data)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.get(
    "/applications/{id}",
    response_model=ApplicationResponse,
    summary="Get application details by ID including complete status audit trail",
)
def get_application_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return application_service.get_application(db=db, app_id=id, user_id=current_user.id)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.patch(
    "/applications/{id}",
    response_model=ApplicationResponse,
    summary="Update application status, notes, or submission timestamp",
)
def update_application_endpoint(
    id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return application_service.update_application(db=db, app_id=id, user_id=current_user.id, data=data)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.delete(
    "/applications/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an application record",
)
def delete_application_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        application_service.delete_application(db=db, app_id=id, user_id=current_user.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

