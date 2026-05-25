import httpx
import re
import asyncio
import sys
import traceback
from pathlib import Path
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import async_session

from ..models import Event

_project_root = str(Path(__file__).resolve().parents[3])
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from telegram_bot.bot import send_event as tg_send_event

WP_API = "https://bplarussia.ru/wp-json/wp/v2/posts"
WP_CATEGORIES = "https://bplarussia.ru/wp-json/wp/v2/categories"

INCIDENT_TYPE_MAP = {
    "Отбой тревоги": "missile_danger_cleared",
    "Отбой авиационной опасности": "missile_danger_cleared",
    "Отбой опасности по БПЛА": "missile_danger_cleared",
    "Отбой ракетной опасности": "missile_danger_cleared",
    "Тревога": "drone_sighting",
    "Атака БПЛА": "explosion",
    "Работа ПВО": "air_defense",
    "Информационное сообщение": "drone_sighting",
    "Повышенное внимание": "drone_sighting",
    "Ракетная опасность": "missile_danger",
    "Снятие ракетной опасности": "missile_danger_cleared",
}

REGION_HINTS = {
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
    "Алтайский край": (53.3478, 83.7798),
    "Амурская область": (50.2904, 127.5272),
}


async def get_region_coords(client: httpx.AsyncClient) -> dict[str, tuple[float, float]]:
    coords = {}
    page = 1
    while True:
        resp = await client.get(WP_CATEGORIES, params={"per_page": 100, "page": page})
        if resp.status_code != 200:
            break
        cats = resp.json()
        if not cats:
            break
        for cat in cats:
            name = cat.get("name", "")
            meta = cat.get("meta", {})
            c = meta.get("coordinates", "")
            if c:
                parts = c.split(",")
                if len(parts) == 2:
                    try:
                        coords[name] = (float(parts[0].strip()), float(parts[1].strip()))
                    except ValueError:
                        pass
        page += 1
    return coords


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


# Scrape status for monitoring
scrape_status = {
    "last_run": None,
    "last_inserted": 0,
    "last_error": None,
    "running": False,
}


async def _notify_tg(event: dict):
    """Fire-and-forget TG notification (no DB session — in-memory dedup)."""
    try:
        await tg_send_event(event, None)
    except Exception as e:
        print(f"bplarussia.ru: tg notification failed: {type(e).__name__}: {e}")


async def scrape_once(session: AsyncSession) -> int:
    if scrape_status["running"]:
        print("bplarussia.ru: scrape already in progress, skipping")
        return 0

    scrape_status["running"] = True
    inserted = 0

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            cat_coords = await get_region_coords(client)

            # First request to get total pages
            r1 = await client.get(WP_API, params={"per_page": 100, "page": 1, "_fields": "id"})
            if r1.status_code != 200:
                scrape_status["last_error"] = f"HTTP {r1.status_code} on first request"
                return 0
            total_pages = int(r1.headers.get("X-WP-TotalPages", 1))

            for page in range(1, total_pages + 1):
                try:
                    resp = await client.get(WP_API, params={
                        "per_page": 100, "page": page,
                        "_fields": "id,date,title,content,meta,categories,link",
                    })
                    if resp.status_code != 200:
                        print(f"bplarussia.ru: page {page} returned HTTP {resp.status_code}, skipping")
                        continue
                    posts = resp.json()
                    if not posts:
                        break

                    page_has_new = False
                    for post in posts:
                        bpla_id = post.get("id")
                        existing = await session.execute(
                            select(Event).where(Event.bpla_id == bpla_id).limit(1)
                        )
                        if existing.scalar_one_or_none():
                            continue

                        page_has_new = True
                        title = post.get("title", {}).get("rendered", "")[:500]
                        content_html = post.get("content", {}).get("rendered", "")
                        description = strip_html(content_html)[:2000]
                        meta = post.get("meta", {})
                        region = (meta.get("region") or "").strip() or None

                        lat = lng = None
                        if region:
                            coords = REGION_HINTS.get(region) or cat_coords.get(region)
                            if coords:
                                lat, lng = coords

                        incident_type = meta.get("incident_type", "")
                        event_type = INCIDENT_TYPE_MAP.get(incident_type, "drone_sighting")

                        date_str = post.get("date", "")
                        created_at = (
                            datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                            if date_str else datetime.utcnow()
                        )

                        event_obj = Event(
                            title=title,
                            description=description,
                            region=region,
                            lat=lat,
                            lng=lng,
                            event_type=event_type,
                            confidence_score=0.75,
                            source_name="bplarussia.ru",
                            source_url=post.get("link", ""),
                            bpla_id=bpla_id,
                            created_at=created_at,
                            sent_to_tg=True,
                        )
                        session.add(event_obj)
                        inserted += 1

                        try:
                            loop = asyncio.get_running_loop()
                            if loop.is_closed():
                                raise RuntimeError("event loop is closed")
                            loop.create_task(_notify_tg({
                                "bpla_id": bpla_id,
                                "event_type": event_type,
                                "region": region,
                                "lat": lat,
                                "lng": lng,
                                "confidence_score": 0.75,
                                "created_at": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
                                "title": title,
                            }))
                        except Exception:
                            pass

                    if page % 5 == 0 or page == total_pages:
                        await session.commit()

                    # Stop early: if this page had all existing posts, assume subsequent pages are also old
                    if not page_has_new and page > 1:
                        print(f"bplarussia.ru: stopping at page {page} (all posts already exist)")
                        break

                except httpx.RequestError as e:
                    print(f"bplarussia.ru: HTTP error on page {page}: {e}")
                    continue

        if inserted > 0:
            await session.commit()

        scrape_status["last_run"] = datetime.utcnow().isoformat()
        scrape_status["last_inserted"] = inserted
        scrape_status["last_error"] = None
        print(f"bplarussia.ru: done — {inserted} new events")
        return inserted

    except Exception as e:
        tb = traceback.format_exc()
        scrape_status["last_error"] = f"{type(e).__name__}: {e}"
        print(f"bplarussia.ru: scrape failed ({type(e).__name__}: {e})")
        print(f"bplarussia.ru: traceback:\n{tb}")
        return inserted
    finally:
        scrape_status["running"] = False
