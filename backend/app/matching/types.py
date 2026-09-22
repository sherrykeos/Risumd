from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MatchBreakdown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    score: float = Field(..., description="Normalized score between 0.0 and 1.0")
    matched_technologies: List[str] = Field(default_factory=list, description="Technologies matched from JD")
    matched_skills: List[str] = Field(default_factory=list, description="Skills matched from JD (required or preferred)")
    matched_keywords: List[str] = Field(default_factory=list, description="Keywords or responsibility terms matched")
    reasons: List[str] = Field(default_factory=list, description="Human-readable explanation of the score components")


class RankedProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: Optional[str] = None
    score: float
    match_breakdown: MatchBreakdown
    matched_technologies: List[str] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)


class RankedExperience(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    score: float
    match_breakdown: MatchBreakdown
    matched_technologies: List[str] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)


class RankedSkill(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str] = None
    score: float
    match_breakdown: MatchBreakdown


class RankedTechnology(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    score: float
    match_breakdown: MatchBreakdown


class RankedAchievement(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    score: float
    match_breakdown: MatchBreakdown


class JobMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: int
    job_title: str
    company: str
    projects: List[RankedProject] = Field(default_factory=list)
    experiences: List[RankedExperience] = Field(default_factory=list)
    skills: List[RankedSkill] = Field(default_factory=list)
    technologies: List[RankedTechnology] = Field(default_factory=list)
    achievements: List[RankedAchievement] = Field(default_factory=list)
