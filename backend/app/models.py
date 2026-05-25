import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from .database import Base


class EventType(str, enum.Enum):
    DRONE_SIGHTING = "drone_sighting"
    EXPLOSION = "explosion"
    AIR_DEFENSE = "air_defense"
    MISSILE_DANGER = "missile_danger"
    MISSILE_DANGER_CLEARED = "missile_danger_cleared"
    UNCONFIRMED = "unconfirmed"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    region = Column(String(200), nullable=True, index=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    event_type = Column(String(50), nullable=False, index=True, default=EventType.UNCONFIRMED)
    confidence_score = Column(Float, nullable=False, default=0.5)

    source_name = Column(String(300), nullable=True)
    source_url = Column(String(500), nullable=True)
    bpla_id = Column(Integer, nullable=True, unique=True)  # original ID from bplarussia.ru

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    sent_to_tg = Column(Boolean, default=False)
