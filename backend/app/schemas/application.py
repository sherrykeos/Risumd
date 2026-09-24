from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ApplicationStatus
from app.schemas.job import JobResponse


class ApplicationCreate(BaseModel):
    job_id: int = Field(..., description="Target Job ID")
    resume_version_id: int = Field(..., description="Exact Resume Version ID submitted")
    status: ApplicationStatus = Field(default=ApplicationStatus.APPLIED, description="Initial status")
    applied_at: Optional[datetime] = Field(None, description="Timestamp when submitted")
    notes: Optional[str] = Field(None, description="Notes")


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = Field(None, description="New status")
    applied_at: Optional[datetime] = Field(None, description="Updated applied timestamp")
    notes: Optional[str] = Field(None, description="Updated notes")
    status_change_note: Optional[str] = Field(None, description="Optional note explaining status transition")


class ApplicationStatusHistoryResponse(BaseModel):
    id: int
    application_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_at: datetime
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    resume_version_id: int
    status: ApplicationStatus
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    status_history: List[ApplicationStatusHistoryResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
