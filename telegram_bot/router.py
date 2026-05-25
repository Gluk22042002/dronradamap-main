from typing import Optional

from .config import REGION_CHANNELS


def resolve_channel(region: Optional[str]) -> Optional[str]:
    if not region:
        return None
    key = region.strip().lower()
    return REGION_CHANNELS.get(key)
