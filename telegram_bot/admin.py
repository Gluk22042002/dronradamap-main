from typing import Optional, TYPE_CHECKING

COMMANDS = {
    "start": "Запуск бота и приветствие",
    "help": "Список команд",
    "stats": "Статистика системы",
    "regions": "Список регионов и каналов",
    "events": "Последние события",
    "mini": "Открыть BplaScope",
    "status": "Статус бота",
}

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


CALLBACK_PREFIX = "bpla:"


def parse_command(text: str) -> tuple[str, str]:
    if not text or not text.startswith("/"):
        return "", ""
    parts = text.strip().split(maxsplit=1)
    cmd = parts[0].lower().split("@")[0]
    args = parts[1] if len(parts) > 1 else ""
    return cmd, args


def kb(buttons: list[list[dict]]) -> dict:
    return {"inline_keyboard": buttons}


def btn(text: str, data: str) -> dict:
    return {"text": text, "callback_data": f"{CALLBACK_PREFIX}{data}"}


def url_btn(text: str, url: str) -> dict:
    return {"text": text, "url": url}


def back_btn(data: str = "menu") -> list[dict]:
    return [btn("\u25c0\ufe0f Назад", data)]


def mini_app_kb():
    from .config import bot_config
    return {
        "inline_keyboard": [
            [{
                "text": "\U0001f916 Открыть BplaScope",
                "web_app": {"url": bot_config.mini_app_url}
            }],
            [btn("\U0001f4ca Статистика", "stats")],
            [btn("\U0001f5fa Регионы", "regions_0")],
            [btn("\U0001f4f0 События", "events_0")],
            [btn("\U0001f7e2 Статус", "status")],
            [btn("\u2753 Помощь", "help")],
        ]
    }

MENU_KB = mini_app_kb()


def parse_callback(raw: str) -> tuple[str, str]:
    if raw.startswith(CALLBACK_PREFIX):
        parts = raw[len(CALLBACK_PREFIX):].split("_", 1)
        action = parts[0]
        arg = parts[1] if len(parts) > 1 else ""
        return action, arg
    return "", ""


async def handle_callback(action: str, arg: str,
                          message_id: int, chat_id: int,
                          db: Optional["AsyncSession"] = None,
                          ) -> tuple[str, dict, bool]:
    if action == "menu":
        return main_menu()

    if action == "stats":
        text, markup = await cmd_stats(db)
        return text, markup, True

    if action == "status":
        return cmd_status(), MENU_KB, True

    if action == "help":
        return cmd_help(), MENU_KB, True

    if action == "regions":
        page = int(arg) if arg.isdigit() else 0
        text, markup = await cmd_regions(page)
        return text, markup, True

    if action == "events":
        page = int(arg) if arg.isdigit() else 0
        text, markup = await cmd_events_page(db, page)
        return text, markup, True

    if action == "events_more":
        page = int(arg) if arg.isdigit() else 1
        text, markup = await cmd_events_page(db, page)
        return text, markup, True

    return "Неизвестный запрос", MENU_KB, True


def main_menu() -> tuple[str, dict, bool]:
    text = (
        "\U0001f916 <b>BplaScope Bot</b>\n\n"
        "Я отслеживаю активность БПЛА в реальном времени.\n\n"
        "Выбери действие:"
    )
    return text, MENU_KB, True


async def handle_command(cmd: str, args: str,
                         db: Optional["AsyncSession"] = None,
                         ) -> tuple[str, dict]:
    if cmd == "/start":
        return main_menu()[:2]

    if cmd == "/help":
        return cmd_help(), MENU_KB

    if cmd == "/status":
        return cmd_status(), MENU_KB

    if cmd == "/stats":
        return await cmd_stats(db)

    if cmd == "/regions":
        return await cmd_regions(0)

    if cmd == "/events":
        return await cmd_events_page(db, 0)

    if cmd == "/mini":
        return cmd_mini()

    return f"\u2753 Неизвестная команда {cmd}", MENU_KB


def cmd_mini() -> tuple[str, dict]:
    from .config import bot_config
    kb_data = {
        "inline_keyboard": [[
            {"text": "\U0001f916 Открыть BplaScope", "web_app": {"url": bot_config.mini_app_url}}
        ]]
    }
    return (
        "\U0001f916 <b>BplaScope Mini App</b>\n\n"
        "Интерактивная карта с событиями в реальном времени.\n"
        "Статистика, список событий, регионы — всё в удобном интерфейсе.",
        kb_data
    )


def cmd_help() -> str:
    return (
        "\U0001f4cb <b>Команды BplaScope</b>\n\n"
        "Используй кнопки меню или команды:\n"
        "/start — Главное меню\n"
        "/stats — Статистика\n"
        "/regions — Регионы и каналы\n"
        "/events — Последние события\n"
        "/mini — Открыть Mini App\n"
        "/status — Статус бота"
    )


def cmd_status() -> str:
    from .config import bot_config, REGION_CHANNELS
    ok = "\u2705"
    no = "\u274c"
    status = f"{ok} Активен" if bot_config.enabled else f"{no} Отключ\u0435н"
    n_unique = len(set(REGION_CHANNELS.values()))
    return (
        f"\U0001f7e2 <b>Статус бота</b>\n\n"
        f"Бот: {status}\n"
        f"Каналов: {n_unique}"
    )


async def cmd_stats(db: Optional["AsyncSession"] = None) -> tuple[str, dict]:
    if not db:
        return "\u26a0\ufe0f Нет доступа к БД", MENU_KB

    try:
        from sqlalchemy import select, func
        from app.models import Event
        from datetime import datetime

        total = await db.execute(
            select(func.count(Event.id)).where(Event.is_active == True)
        )
        total = total.scalar() or 0

        today = await db.execute(
            select(func.count(Event.id)).where(
                Event.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0),
                Event.is_active == True,
            )
        )
        today = today.scalar() or 0

        by_type = await db.execute(
            select(Event.event_type, func.count(Event.id))
            .where(Event.is_active == True)
            .group_by(Event.event_type)
        )
        types = sorted(by_type.all(), key=lambda x: -x[1])

        lines = ["\U0001f4ca <b>Статистика</b>\n",
                 f"Всего: {total}",
                 f"Сегодня: {today}", ""]
        for t, c in types:
            emoji = {"drone_sighting": "\U0001f6f8", "explosion": "\U0001f4a5",
                     "air_defense": "\u26a1"}.get(t, "\u2753")
            lines.append(f"{emoji} {t}: {c}")

        return "\n".join(lines), MENU_KB
    except Exception as e:
        return f"\u274c Ошибка: {e}", MENU_KB


async def cmd_regions(page: int = 0) -> tuple[str, dict]:
    from .config import REGION_CHANNELS

    unique: dict[str, list[str]] = {}
    for region, chan in REGION_CHANNELS.items():
        unique.setdefault(chan, []).append(region)

    sorted_chans = sorted(unique)
    per_page = 10
    total_pages = max(1, (len(sorted_chans) + per_page - 1) // per_page)
    page = max(0, min(page, total_pages - 1))
    start = page * per_page
    chunk = sorted_chans[start:start + per_page]

    lines = [f"\U0001f5fa <b>Регионы</b> (стр. {page + 1}/{total_pages})\n"]
    for chan in chunk:
        regions = ", ".join(r.capitalize() for r in unique[chan])
        lines.append(f"{chan}\n  {regions}")

    nav = []
    if page > 0:
        nav.append(btn("\u25c0 Пред.", f"regions_{page - 1}"))
    if page < total_pages - 1:
        nav.append(btn("След. \u25b6", f"regions_{page + 1}"))

    buttons = []
    if nav:
        buttons.append(nav)
    buttons.append(back_btn())

    return "\n".join(lines), kb(buttons)


async def cmd_events_page(db: Optional["AsyncSession"], page: int = 0) -> tuple[str, dict]:
    if not db:
        return "\u26a0\ufe0f Нет доступа к БД", MENU_KB

    try:
        from sqlalchemy import select, func
        from app.models import Event
        limit = 5
        offset = page * limit

        count_q = select(func.count(Event.id)).where(Event.is_active == True)
        total = (await db.execute(count_q)).scalar() or 0

        result = await db.execute(
            select(Event)
            .where(Event.is_active == True)
            .order_by(Event.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        events = result.scalars().all()

        if not events:
            return "Нет событий", MENU_KB

        total_pages = max(1, (total + limit - 1) // limit)
        lines = [f"\U0001f4f0 <b>События</b> (стр. {page + 1}/{total_pages})\n"]
        for e in events:
            emoji = {"drone_sighting": "\U0001f6f8", "explosion": "\U0001f4a5",
                     "air_defense": "\u26a1"}.get(e.event_type, "\u2753")
            title = (e.title or "Без названия")[:60]
            lines.append(f"{emoji} [{e.region}] {title}")

        nav = []
        if page > 0:
            nav.append(btn("\u25c0 Пред.", f"events_{page - 1}"))
        if offset + limit < total:
            nav.append(btn("След. \u25b6", f"events_{page + 1}"))

        buttons = []
        if nav:
            buttons.append(nav)
        buttons.append(back_btn())

        return "\n".join(lines), kb(buttons)

    except Exception as e:
        return f"\u274c Ошибка: {e}", MENU_KB
