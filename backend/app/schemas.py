from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

class DistrictBase(BaseModel):
    district_id: int
    name: str
    lat: float
    lon: float

    class Config:
        from_attributes = True

class CrimeEventBase(BaseModel):
    event_id: int
    district_id: int
    crime_type: str
    occurred_at: datetime
    lat: float
    lon: float
    status: Optional[str] = None
    severity: Optional[int] = None

    class Config:
        from_attributes = True

class OfficerBase(BaseModel):
    name: str
    badge_number: Optional[str] = None
    status: Optional[Literal["AVAILABLE", "DISPATCHED", "OFF-DUTY"]] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    district_id: Optional[int] = None

class OfficerCreate(OfficerBase):
    pass

class OfficerResponse(OfficerBase):
    officer_id: int

    class Config:
        from_attributes = True
