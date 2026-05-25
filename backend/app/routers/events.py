from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast, Date, case
from typing import Optional, List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Event
from ..schemas import EventResponse, EventListResponse, StatsResponse, TimelineEntry

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def get_events(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    region: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Event).where(Event.is_active == True)
    if region:
        query = query.where(Event.region.ilike(f"%{region}%"))
    if event_type:
        query = query.where(Event.event_type == event_type)
    if search:
        query = query.where(
            Event.title.ilike(f"%{search}%")
        )
    if date_from:
        query = query.where(Event.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(Event.created_at <= datetime.fromisoformat(date_to))

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Event.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    events = result.scalars().all()

    return EventListResponse(
        events=[EventResponse.model_validate(e) for e in events],
        total=total,
    )


@router.get("/map", response_model=List[EventResponse])
async def get_map_events(
    region: Optional[str] = None,
    event_type: Optional[str] = None,
    hours: int = Query(72, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
):
    query = select(Event).where(
        and_(
            Event.is_active == True,
            Event.lat.isnot(None),
            Event.lng.isnot(None),
            Event.created_at >= datetime.utcnow() - timedelta(hours=hours),
        )
    )
    if region:
        query = query.where(Event.region.ilike(f"%{region}%"))
    if event_type:
        query = query.where(Event.event_type == event_type)

    query = query.order_by(Event.created_at.desc())
    result = await db.execute(query)
    events = result.scalars().all()
    return [EventResponse.model_validate(e) for e in events]


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Event.id)).where(Event.is_active == True))).scalar() or 0
    today = (await db.execute(
        select(func.count(Event.id)).where(
            Event.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0),
            Event.is_active == True,
        )
    )).scalar() or 0

    type_counts = await db.execute(
        select(Event.event_type, func.count(Event.id))
        .where(Event.is_active == True)
        .group_by(Event.event_type)
    )
    events_by_type = {row[0]: row[1] for row in type_counts.all()}

    return StatsResponse(
        total_events=total,
        events_by_type=events_by_type,
        events_today=today,
    )


@router.get("/timeline", response_model=List[TimelineEntry])
async def get_timeline(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    rows = await db.execute(
        select(
            cast(Event.created_at, Date).label("day"),
            func.count(Event.id).label("total"),
            func.sum(case((Event.event_type == "air_defense", 1), else_=0)).label("air_defense"),
            func.sum(case((Event.event_type == "explosion", 1), else_=0)).label("explosions"),
            func.sum(case((Event.event_type == "drone_sighting", 1), else_=0)).label("sightings"),
        )
        .where(Event.is_active == True, Event.created_at >= since)
        .group_by(cast(Event.created_at, Date))
        .order_by(cast(Event.created_at, Date).desc())
    )
    result = []
    for row in rows:
        total = row.total or 0
        ad = row.air_defense or 0
        exp = row.explosions or 0
        sig = row.sightings or 0
        result.append(TimelineEntry(
            date=str(row.day),
            total=total,
            shot_down=ad,
            explosions=exp,
            sightings=sig,
            air_defense=ad,
        ))
    return result


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event).where(Event.id == event_id, Event.is_active == True)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventResponse.model_validate(event)
