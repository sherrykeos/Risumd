from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.skill import SkillResponse
from app.schemas.technology import TechnologyResponse
from app.schemas.achievement import AchievementResponse, AchievementLinkOrCreate


class ExperienceBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=255, description="Company or organization name")
    role: str = Field(..., min_length=1, max_length=255, description="Job title or role")
    description: Optional[str] = Field(None, description="Detailed description of responsibilities")
    start_date: Optional[date] = Field(None, description="Employment start date")
    end_date: Optional[date] = Field(None, description="Employment end date (null for current)")
    location: Optional[str] = Field(None, max_length=255, description="Location (city, country, or remote)")

    @field_validator("company", "role")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ExperienceBase":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ExperienceCreate(ExperienceBase):
    technologies: List[Union[str, int]] = Field(
        default_factory=list,
        description="List of technology names or technology IDs to associate"
    )
    skills: List[Union[str, int]] = Field(
        default_factory=list,
        description="List of skill names or skill IDs to associate"
    )
    achievements: List[Union[int, AchievementLinkOrCreate, Dict[str, Any]]] = Field(
        default_factory=list,
        description="List of achievement IDs or nested achievement objects to associate"
    )


class ExperienceUpdate(BaseModel):
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None

    technologies: Optional[List[Union[str, int]]] = None
    skills: Optional[List[Union[str, int]]] = None
    achievements: Optional[List[Union[int, AchievementLinkOrCreate, Dict[str, Any]]]] = None

    @field_validator("company", "role")
    @classmethod
    def validate_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ExperienceUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ExperienceResponse(BaseModel):
    id: int
    company: str
    role: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    skills: List[SkillResponse] = []
    technologies: List[TechnologyResponse] = []
    achievements: List[AchievementResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ExperienceListResponse(BaseModel):
    items: List[ExperienceResponse]
    total: int
