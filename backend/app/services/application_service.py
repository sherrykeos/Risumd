import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import EntityNotFoundException, ValidationException
from app.models.application import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.enums import ApplicationStatus
from app.models.job import Job
from app.models.resume_version import ResumeVersion
from app.schemas.application import ApplicationCreate, ApplicationUpdate

logger = logging.getLogger(__name__)


class ApplicationService:
    @staticmethod
    def create_application(db: Session, data: ApplicationCreate) -> Application:
        """
        Creates a new Job Application linking a Job and an EXACT ResumeVersion.
        Validates that the ResumeVersion belongs to the target Job.
        Records the initial status history entry.
        """
        job = db.query(Job).filter(Job.id == data.job_id).first()
        if not job:
            raise EntityNotFoundException("Job", data.job_id)

        resume_version = db.query(ResumeVersion).filter(ResumeVersion.id == data.resume_version_id).first()
        if not resume_version:
            raise EntityNotFoundException("ResumeVersion", data.resume_version_id)

        # Validate that the resume version belongs to the target job
        if resume_version.job_id != data.job_id:
            raise ValidationException(
                f"ResumeVersion {data.resume_version_id} belongs to Job {resume_version.job_id}, "
                f"not Job {data.job_id}."
            )

        applied_at = data.applied_at
        if applied_at is None and data.status == ApplicationStatus.APPLIED:
            applied_at = datetime.now(timezone.utc)

        app = Application(
            job_id=data.job_id,
            resume_version_id=data.resume_version_id,
            status=data.status,
            applied_at=applied_at,
            notes=data.notes,
        )
        db.add(app)
        db.flush()

        # Initial status history record
        history = ApplicationStatusHistory(
            application_id=app.id,
            old_status=None,
            new_status=data.status.value,
            note="Application created",
        )
        db.add(history)
        db.commit()

        return ApplicationService.get_application(db, app.id)

    @staticmethod
    def get_application(db: Session, app_id: int) -> Application:
        app = (
            db.query(Application)
            .options(
                selectinload(Application.job),
                selectinload(Application.resume_version),
                selectinload(Application.status_history),
            )
            .filter(Application.id == app_id)
            .first()
        )
        if not app:
            raise EntityNotFoundException("Application", app_id)
        return app

    @staticmethod
    def list_applications(db: Session) -> List[Application]:
        return (
            db.query(Application)
            .options(
                selectinload(Application.job),
                selectinload(Application.resume_version),
                selectinload(Application.status_history),
            )
            .order_by(Application.created_at.desc())
            .all()
        )

    @staticmethod
    def update_application(db: Session, app_id: int, data: ApplicationUpdate) -> Application:
        """
        Updates application status, notes, or applied_at.
        Records an immutable ApplicationStatusHistory entry on status transitions.
        """
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise EntityNotFoundException("Application", app_id)

        if data.status is not None and data.status != app.status:
            old_status_val = app.status.value if hasattr(app.status, "value") else str(app.status)
            new_status_val = data.status.value

            history = ApplicationStatusHistory(
                application_id=app.id,
                old_status=old_status_val,
                new_status=new_status_val,
                note=data.status_change_note or f"Status changed from {old_status_val} to {new_status_val}",
            )
            db.add(history)
            app.status = data.status

            if data.status == ApplicationStatus.APPLIED and app.applied_at is None and data.applied_at is None:
                app.applied_at = datetime.now(timezone.utc)

        if data.applied_at is not None:
            app.applied_at = data.applied_at

        if data.notes is not None:
            app.notes = data.notes

        db.commit()
        return ApplicationService.get_application(db, app.id)

    @staticmethod
    def delete_application(db: Session, app_id: int) -> None:
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise EntityNotFoundException("Application", app_id)
        db.delete(app)
        db.commit()


application_service = ApplicationService()
