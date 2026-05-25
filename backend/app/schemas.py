from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    region: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    event_type: str
    confidence_score: float
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    events: List[EventResponse]
    total: int


class RegionInfo(BaseModel):
    name: str
    event_count: int
    lat: float
    lng: float


class TimelineEntry(BaseModel):
    date: str
    total: int
    shot_down: int
    explosions: int
    sightings: int
    air_defense: int


class StatsResponse(BaseModel):
    total_events: int
    events_by_type: dict
    events_today: int
