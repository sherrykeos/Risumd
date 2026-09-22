from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.skill import SkillResponse
from app.schemas.technology import TechnologyResponse
from app.schemas.achievement import AchievementResponse, AchievementLinkOrCreate


def validate_optional_url(url: Optional[str]) -> Optional[str]:
    if url is None:
        return None
    url = url.strip()
    if not url:
        return None
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValueError("URL must start with http:// or https://")
    return url


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, description="Detailed project description")
    role: Optional[str] = Field(None, max_length=255, description="User's role on the project")
    start_date: Optional[date] = Field(None, description="Project start date")
    end_date: Optional[date] = Field(None, description="Project end date")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    live_url: Optional[str] = Field(None, description="Live project or demo URL")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Project name cannot be empty or whitespace only")
        return v

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_url(v)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectBase":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ProjectCreate(ProjectBase):
    # Flexible associations: list of names or IDs
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


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None

    technologies: Optional[List[Union[str, int]]] = None
    skills: Optional[List[Union[str, int]]] = None
    achievements: Optional[List[Union[int, AchievementLinkOrCreate, Dict[str, Any]]]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Project name cannot be empty or whitespace only")
        return v

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_url(v)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    skills: List[SkillResponse] = []
    technologies: List[TechnologyResponse] = []
    achievements: List[AchievementResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int
