import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_ID = os.getenv("TG_API_ID")
API_HASH = os.getenv("TG_API_HASH")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

CHANNELS = [
    "@mash",
    "@bbbreaking",
    "@kuban_news",
]


async def send_to_backend(event_data: dict):
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"{BACKEND_URL}/api/events/ingest", json=event_data, timeout=10)
            if r.status_code == 200:
                print(f"Sent: {event_data['title'][:50]}")
            else:
                print(f"Error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"Failed to send: {e}")


async def main():
    print("Parser bot starting...")
    print("NOTE: Set TG_API_ID and TG_API_HASH in .env to enable actual Telegram parsing.")
    print("For now, backend is ready to receive events via POST /api/events/ingest")

    if API_ID and API_HASH:
        from telethon import TelegramClient

        client = TelegramClient("parser_session", int(API_ID), API_HASH)
        await client.start()

        for channel in CHANNELS:
            try:
                entity = await client.get_entity(channel)
                async for message in client.iter_messages(entity, limit=5):
                    if message.text:
                        event = {
                            "title": message.text[:200],
                            "description": message.text[:2000],
                            "event_type": "unconfirmed",
                            "confidence_score": 0.5,
                            "source_name": channel,
                            "source_url": f"https://t.me/{channel}/{message.id}",
                        }
                        await send_to_backend(event)
                        await asyncio.sleep(1)
            except Exception as e:
                print(f"Error with {channel}: {e}")
    else:
        print("Telegram credentials not configured. Running in API-only mode.")

    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
