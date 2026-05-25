import logging
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..schemas import EventResponse

_project_root = str(Path(__file__).resolve().parents[3])
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from telegram_bot.bot import send_event

logger = logging.getLogger("bplascope.ingest")
router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("/event")
async def ingest_event(event: EventResponse):
    try:
        result = await send_event(event.model_dump())
        return result
    except Exception as e:
        logger.error("ingest error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
