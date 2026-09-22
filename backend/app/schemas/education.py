from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class EducationBase(BaseModel):
    institution: str = Field(..., min_length=1, max_length=255, description="Institution or University name")
    degree: str = Field(..., min_length=1, max_length=255, description="Degree earned or pursued")
    field: Optional[str] = Field(None, max_length=255, description="Field of study")
    start_date: Optional[date] = Field(None, description="Start date")
    end_date: Optional[date] = Field(None, description="End date or expected graduation")
    grade: Optional[str] = Field(None, max_length=100, description="GPA or grade")
    description: Optional[str] = Field(None, description="Additional details")

    @field_validator("institution", "degree")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "EducationBase":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class EducationCreate(EducationBase):
    pass


class EducationUpdate(BaseModel):
    institution: Optional[str] = Field(None, min_length=1, max_length=255)
    degree: Optional[str] = Field(None, min_length=1, max_length=255)
    field: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grade: Optional[str] = None
    description: Optional[str] = None

    @field_validator("institution", "degree")
    @classmethod
    def validate_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "EducationUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class EducationResponse(BaseModel):
    id: int
    institution: str
    degree: str
    field: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grade: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EducationListResponse(BaseModel):
    items: List[EducationResponse]
    total: int
