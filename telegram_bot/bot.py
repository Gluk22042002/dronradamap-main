import logging
from typing import Optional, TYPE_CHECKING

import httpx

from .config import bot_config
from .filters import validate_event
from .dedup import dedup
from .router import resolve_channel
from .formatter import format_event

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("bplascope.bot")


async def send_event(event: dict, db: Optional["AsyncSession"] = None) -> dict:
    result = {
        "sent": False,
        "channel": None,
        "reason": None,
    }

    if not bot_config.enabled:
        result["reason"] = "bot_disabled"
        return result

    filter_reason = validate_event(event)
    if filter_reason:
        logger.info("filtered out: %s — %s", event.get("bpla_id", "?"), filter_reason)
        result["reason"] = filter_reason
        return result

    event_type = event.get("event_type", "")
    region = event.get("region", "")
    bpla_id = event.get("bpla_id") or event.get("id")

    if await dedup.is_duplicate(bpla_id, event_type, region, db):
        logger.info("duplicate skipped: bpla_id=%s region=%s", bpla_id, region)
        result["reason"] = "duplicate"
        return result

    channel = resolve_channel(region)
    if not channel:
        logger.info("no channel for region: %s", region)
        result["reason"] = f"no_channel_for_region:{region}"
        return result

    text = format_event(event, channel)
    ok = await _telegram_send(channel, text)

    if ok:
        await dedup.mark_seen(bpla_id, event_type, region, db)
        logger.info("sent to %s: bpla_id=%s", channel, bpla_id)
        result["sent"] = True
        result["channel"] = channel
    else:
        logger.error("failed to send to %s: bpla_id=%s", channel, bpla_id)
        result["reason"] = "telegram_api_error"

    return result


async def _telegram_send(chat_id: str, text: str) -> bool:
    url = f"{bot_config.api_base}{bot_config.token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": bot_config.parse_mode,
        "disable_web_page_preview": bot_config.disable_web_page_preview,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200
        except httpx.RequestError as e:
            logger.error("telegram request error: %s", e)
            return False
