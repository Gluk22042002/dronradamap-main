from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from ..database import get_db
from ..models import Event
from ..schemas import RegionInfo

router = APIRouter(prefix="/api/regions", tags=["regions"])

REGION_COORDS = {
    "Москва": (55.7558, 37.6173),
    "Московская область": (55.7558, 37.6173),
    "Санкт-Петербург": (59.9343, 30.3351),
    "Ленинградская область": (59.9343, 30.3351),
    "Краснодарский край": (45.0355, 38.9753),
    "Ростовская область": (47.2357, 39.7015),
    "Воронежская область": (51.6720, 39.1843),
    "Курская область": (51.7373, 36.1874),
    "Белгородская область": (50.5997, 36.5986),
    "Брянская область": (53.2434, 34.3637),
    "Калужская область": (54.5138, 36.2615),
    "Смоленская область": (54.7826, 32.0453),
    "Тверская область": (56.8587, 35.9176),
    "Нижегородская область": (56.3269, 44.0059),
    "Татарстан": (55.7961, 49.1064),
    "Самарская область": (53.1956, 50.1062),
    "Саратовская область": (51.5336, 46.0343),
    "Волгоградская область": (48.7080, 44.5133),
    "Крым": (44.9482, 34.1003),
    "Севастополь": (44.6167, 33.5256),
    "Тульская область": (54.1961, 37.6182),
    "Липецкая область": (52.6032, 39.5992),
    "Орловская область": (52.9701, 36.0633),
    "Псковская область": (57.8136, 28.3496),
    "Новгородская область": (58.5228, 31.2750),
    "Вологодская область": (59.2181, 39.8886),
    "Ярославская область": (57.6261, 39.8845),
    "Ивановская область": (56.9997, 40.9736),
    "Владимирская область": (56.1291, 40.4466),
    "Рязанская область": (54.6269, 39.6916),
    "Тамбовская область": (52.7317, 41.4433),
    "Пензенская область": (53.1959, 45.0184),
    "Ульяновская область": (54.3142, 48.4031),
    "Кировская область": (58.5966, 49.6601),
    "Удмуртия": (56.8528, 53.2044),
    "Чувашия": (56.1322, 47.2519),
    "Марий Эл": (56.6344, 47.8998),
    "Мордовия": (54.1867, 45.1838),
    "Астраханская область": (46.3497, 48.0408),
    "Калининградская область": (54.7104, 20.4522),
    "Костромская область": (57.7679, 40.9269),
}


@router.get("", response_model=List[RegionInfo])
async def get_regions(db: AsyncSession = Depends(get_db)):
    # Events with region
    result = await db.execute(
        select(Event.region, func.count(Event.id))
        .where(Event.region.isnot(None), Event.is_active == True)
        .group_by(Event.region)
        .order_by(func.count(Event.id).desc())
    )
    rows = result.all()
    regions = []
    for name, count in rows:
        coords = REGION_COORDS.get(name, (55.7558, 37.6173))
        regions.append(RegionInfo(name=name, event_count=count, lat=coords[0], lng=coords[1]))

    # Uncounted events (no region)
    nocat = await db.execute(
        select(func.count(Event.id))
        .where(Event.region.is_(None), Event.is_active == True)
    )
    nocat_count = nocat.scalar() or 0
    if nocat_count > 0:
        regions.append(RegionInfo(name="Без категории", event_count=nocat_count, lat=0, lng=0))

    return regions
