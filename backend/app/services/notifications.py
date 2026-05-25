from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import Subscription, Event


async def notify_subscribers(event: Event, db: AsyncSession):
    result = await db.execute(
        select(Subscription).where(Subscription.is_active == True)
    )
    subscriptions = result.scalars().all()

    for sub in subscriptions:
        if sub.region and sub.region.lower() not in (event.region or "").lower():
            continue
        if sub.event_type and sub.event_type != event.event_type:
            continue

        # In production: send via Telegram Bot API or Web Push
        if sub.telegram_id:
            pass  # await send_telegram_notification(sub.telegram_id, event)
        if sub.email:
            pass  # await send_email_notification(sub.email, event)
