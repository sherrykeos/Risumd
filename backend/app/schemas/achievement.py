from datetime import date as dt_date, datetime as dt_datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AchievementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Achievement title")
    description: Optional[str] = Field(None, description="Detailed description of the achievement")
    date: Optional[dt_date] = Field(None, description="Date of the achievement")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Achievement title cannot be empty or whitespace only")
        return v


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    date: Optional[dt_date] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Achievement title cannot be empty or whitespace only")
        return v


class AchievementLinkOrCreate(BaseModel):
    id: Optional[int] = Field(None, description="ID of existing achievement to link")
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Title for new achievement")
    description: Optional[str] = None
    date: Optional[dt_date] = None

    @model_validator(mode="after")
    def check_id_or_title(self) -> "AchievementLinkOrCreate":
        if self.id is None and not self.title:
            raise ValueError("Either an achievement 'id' or a 'title' must be provided")
        return self


class AchievementResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date: Optional[dt_date] = None
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


class AchievementListResponse(BaseModel):
    items: List[AchievementResponse]
    total: int
