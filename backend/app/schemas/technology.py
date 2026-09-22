from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TechnologyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique technology name")
    description: Optional[str] = Field(None, description="Optional description of the technology")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Technology name cannot be empty or whitespace only")
        return v


class TechnologyCreate(TechnologyBase):
    pass


class TechnologyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Technology name cannot be empty or whitespace only")
        return v


class TechnologyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TechnologyListResponse(BaseModel):
    items: List[TechnologyResponse]
    total: int
