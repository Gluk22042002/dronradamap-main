import asyncio
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import update, text
from .config import settings
from .database import init_db, async_session
from .routers import events, regions, ingest
from .services.scraper import scrape_once, scrape_status
from .models import Event

# Windows ProactorEventLoop can cause OSError with asyncio tasks
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

_project_root = str(Path(__file__).resolve().parents[2])
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from telegram_bot.poller import start_poller, stop_poller
from telegram_bot.config import bot_config


SCRAPE_INTERVAL = 30  # 30 seconds

async def auto_scrape():
    try:
        async with async_session() as session:
            inserted = await scrape_once(session)
            if inserted > 0:
                print(f"bplarussia.ru: +{inserted} new events")
    except Exception as e:
        print(f"bplarussia.ru: scrape failed ({type(e).__name__}: {e})")

async def periodic_scrape():
    await asyncio.sleep(10)  # wait for startup
    consecutive_failures = 0
    while True:
        try:
            await auto_scrape()
            consecutive_failures = 0
        except Exception as e:
            consecutive_failures += 1
            wait = min(consecutive_failures * 5, 60)
            print(f"bplarussia.ru: periodic scrape error ({consecutive_failures}x): {type(e).__name__}: {e}, retrying in {wait}s")
            await asyncio.sleep(wait)
            continue
        await asyncio.sleep(SCRAPE_INTERVAL)


async def migrate_schema():
    try:
        async with async_session() as session:
            from sqlalchemy import text
            result = await session.execute(
                text("PRAGMA table_info(events)")
            )
            cols = {row[1] for row in result.fetchall()}
            if "sent_to_tg" not in cols:
                await session.execute(
                    text("ALTER TABLE events ADD COLUMN sent_to_tg BOOLEAN DEFAULT 0")
                )
                await session.commit()
                print("Migration: added sent_to_tg column")
    except Exception as e:
        print(f"Migration schema: {e}")


async def confirm_all():
    try:
        async with async_session() as session:
            result = await session.execute(
                update(Event).where(Event.event_type == "unconfirmed").values(event_type="drone_sighting")
            )
            await session.commit()
            if result.rowcount:
                print(f"Migration: confirmed {result.rowcount} unconfirmed events")
    except Exception as e:
        print(f"Migration failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await migrate_schema()
    await confirm_all()

    if bot_config.enabled:
        poller_task = asyncio.create_task(
            start_poller(lambda: async_session())
        )
        try:
            await _set_bot_commands()
        except Exception:
            pass

    scrape_task = asyncio.create_task(periodic_scrape())
    yield

    stop_poller()
    scrape_task.cancel()
    if bot_config.enabled:
        poller_task.cancel()
        try:
            await poller_task
        except asyncio.CancelledError:
            pass


async def _set_bot_commands():
    import httpx
    from telegram_bot.admin import COMMANDS
    url = f"{bot_config.api_base}{bot_config.token}/setMyCommands"
    commands = [{"command": c, "description": d} for c, d in COMMANDS.items()]
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json={"commands": commands})


app = FastAPI(
    title="BplaScope OSINT Platform",
    description="Мониторинг БПЛА (данные: bplarussia.ru)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(regions.router)
app.include_router(ingest.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "source": "bplarussia.ru"}


@app.post("/api/scrape")
async def manual_scrape():
    async with async_session() as session:
        inserted = await scrape_once(session)
    return {"scraped": inserted, "source": "bplarussia.ru"}

@app.get("/api/scrape/status")
async def get_scrape_status():
    return {
        "source": "bplarussia.ru",
        **scrape_status,
    }
