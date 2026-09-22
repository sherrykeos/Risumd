from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique skill name")
    category: Optional[str] = Field(None, max_length=100, description="Skill category, e.g., Backend, Frontend, Cloud")
    description: Optional[str] = Field(None, description="Optional description of the skill")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Skill name cannot be empty or whitespace only")
        return v


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Skill name cannot be empty or whitespace only")
        return v


class SkillResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SkillListResponse(BaseModel):
    items: List[SkillResponse]
    total: int
