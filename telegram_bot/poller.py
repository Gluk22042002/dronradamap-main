import asyncio
import logging
from typing import Optional, TYPE_CHECKING, Any

import httpx

from .config import bot_config
from .admin import parse_command, handle_command, handle_callback, parse_callback, MENU_KB

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("bplascope.poller")

_offset: int = 0
_running: bool = False


async def start_poller(db_factory: Optional[callable] = None):
    global _running
    if _running:
        return
    _running = True

    if not bot_config.enabled:
        logger.info("poller: bot disabled, skipping")
        _running = False
        return

    logger.info("poller: started")
    while _running:
        try:
            await _poll_once(db_factory)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("poller error: %s", e)
        await asyncio.sleep(2)


def stop_poller():
    global _running
    _running = False


async def _poll_once(db_factory: Optional[callable]):
    global _offset

    url = f"{bot_config.api_base}{bot_config.token}/getUpdates"
    params = {
        "offset": _offset + 1,
        "timeout": 10,
        "allowed_updates": ["message", "callback_query"],
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return
            data = resp.json()
        except httpx.RequestError:
            return

    if not data.get("ok"):
        return

    for update in data.get("result", []):
        _offset = update.get("update_id", _offset)

        cq = update.get("callback_query")
        if cq:
            await _handle_callback(cq, db_factory)
            continue

        msg = update.get("message")
        if not msg or not msg.get("text"):
            continue

        chat_id = msg["chat"]["id"]
        text = msg["text"]
        cmd, args = parse_command(text)

        if not cmd:
            continue

        db = None
        if db_factory:
            try:
                db = await db_factory().__aenter__()
            except Exception:
                db = None

        try:
            reply, reply_markup = await handle_command(cmd, args, db)
        except Exception as e:
            reply = f"\u274c Ошибка обработки команды: {e}"
            reply_markup = MENU_KB
            logger.error("cmd error %s: %s", cmd, e)

        if db:
            try:
                await db.close()
            except Exception:
                pass

        await _send_message(chat_id, reply, reply_markup)


async def _handle_callback(cq: dict, db_factory: Optional[callable]):
    chat_id = cq["message"]["chat"]["id"]
    message_id = cq["message"]["message_id"]
    data = cq.get("data", "")
    cq_id = cq["id"]

    action, arg = parse_callback(data)
    if not action:
        return

    db = None
    if db_factory:
        try:
            db = await db_factory().__aenter__()
        except Exception:
            db = None

    try:
        text, reply_markup, _ = await handle_callback(action, arg, message_id, chat_id, db)
    except Exception as e:
        text = f"\u274c Ошибка: {e}"
        reply_markup = MENU_KB
        logger.error("callback error %s: %s", action, e)

    if db:
        try:
            await db.close()
        except Exception:
            pass

    async with httpx.AsyncClient(timeout=10) as client:
        url = f"{bot_config.api_base}{bot_config.token}/answerCallbackQuery"
        try:
            await client.post(url, json={"callback_query_id": cq_id})
        except httpx.RequestError:
            pass

        url = f"{bot_config.api_base}{bot_config.token}/editMessageText"
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup

        try:
            await client.post(url, json=payload)
        except httpx.RequestError:
            pass


async def _send_message(chat_id: int, text: str, reply_markup: Optional[dict] = None):
    url = f"{bot_config.api_base}{bot_config.token}/sendMessage"
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, json=payload)
        except httpx.RequestError:
            pass
