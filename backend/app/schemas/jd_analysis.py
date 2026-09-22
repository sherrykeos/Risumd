from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class JDAnalysisBase(BaseModel):
    seniority: Optional[str] = Field(None, max_length=100, description="Seniority level, e.g. Junior, Mid, Senior, Lead")
    domain: Optional[str] = Field(None, max_length=100, description="Functional domain, e.g. Backend Development, Data Engineering")
    required_skills: List[str] = Field(default_factory=list, description="List of required skills")
    preferred_skills: List[str] = Field(default_factory=list, description="List of preferred or nice-to-have skills")
    technologies: List[str] = Field(default_factory=list, description="List of technologies, frameworks, and tools")
    responsibilities: List[str] = Field(default_factory=list, description="Key duties and responsibilities")
    keywords: List[str] = Field(default_factory=list, description="Relevant domain and role keywords")
    summary: Optional[str] = Field(None, description="Concise summary of the role and analysis")


class JDAnalysisCreate(JDAnalysisBase):
    pass


class JDAnalysisUpdate(BaseModel):
    seniority: Optional[str] = Field(None, max_length=100)
    domain: Optional[str] = Field(None, max_length=100)
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    summary: Optional[str] = None


class JDAnalysisResponse(BaseModel):
    id: int
    job_id: int
    seniority: Optional[str] = None
    domain: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    technologies: List[str] = []
    responsibilities: List[str] = []
    keywords: List[str] = []
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
