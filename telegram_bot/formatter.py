from datetime import datetime
from typing import Optional

from .filters import get_severity
from .config import CHANNEL_DISPLAY_NAMES


def format_event(event: dict, channel: Optional[str] = None) -> str:
    region = event.get("region", "N/A")
    title = event.get("title", "")
    description = event.get("description", "")

    body = title if title else "Событие с БПЛА"
    if description:
        body += f"\n{description}"

    channel_name = CHANNEL_DISPLAY_NAMES.get(channel, "")
    channel_link = channel or ""

    footer = f"\u2757\ufe0f {channel_name} - {channel_link}" if channel_name else ""

    parts = [region, body]
    if footer:
        parts.append("")
        parts.append(footer)

    return "\n".join(parts)
