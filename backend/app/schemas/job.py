from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.jd_analysis import JDAnalysisResponse
from app.schemas.project import validate_optional_url


class JobBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    title: str = Field(..., min_length=1, max_length=255, description="Job title")
    location: Optional[str] = Field(None, max_length=255, description="Job location")
    source_url: Optional[str] = Field(None, description="URL of the job posting")
    raw_description: str = Field(..., min_length=1, description="Unprocessed raw job description text")

    @field_validator("company", "title", "raw_description")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only")
        return v

    @field_validator("source_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_url(v)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = None
    source_url: Optional[str] = None
    raw_description: Optional[str] = Field(None, min_length=1)

    @field_validator("company", "title", "raw_description")
    @classmethod
    def validate_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or whitespace only")
        return v

    @field_validator("source_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_url(v)


class JobResponse(BaseModel):
    id: int
    company: str
    title: str
    location: Optional[str] = None
    source_url: Optional[str] = None
    raw_description: str
    created_at: datetime
    updated_at: datetime
    analysis: Optional[JDAnalysisResponse] = None

    model_config = ConfigDict(from_attributes=True)
