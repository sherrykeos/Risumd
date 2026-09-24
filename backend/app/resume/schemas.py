from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ContactInfo(BaseModel):
    name: str = Field(..., description="Candidate full name")
    email: str = Field(..., description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    location: Optional[str] = Field(None, description="Location (City, Country)")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    portfolio: Optional[str] = Field(None, description="Portfolio website URL")


class ResumeProjectItem(BaseModel):
    id: int
    name: str
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)


class ResumeExperienceItem(BaseModel):
    id: int
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)


class ResumeEducationItem(BaseModel):
    id: int
    institution: str
    degree: str
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    grade: Optional[str] = None
    description: Optional[str] = None


class ResumeSkillGroup(BaseModel):
    category: str
    skills: List[str] = Field(default_factory=list)


class ResumeData(BaseModel):
    """
    Deterministic, strongly-typed frozen snapshot of all information used in a resume version.
    """
    contact: ContactInfo
    summary: Optional[str] = None
    skill_groups: List[ResumeSkillGroup] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    experience: List[ResumeExperienceItem] = Field(default_factory=list)
    projects: List[ResumeProjectItem] = Field(default_factory=list)
    education: List[ResumeEducationItem] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)


class ResumeGenerateRequest(BaseModel):
    """Optional overrides when requesting a resume generation."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None


class ResumeVersionResponse(BaseModel):
    id: int
    job_id: int
    version_number: int
    resume_data: Dict[str, Any]
    pdf_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
