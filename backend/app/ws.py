import asyncio
from fastapi import WebSocket
from redis import Redis


async def bridge_redis_to_ws(redis: Redis, project_id: str, ws: WebSocket) -> None:
    pubsub = redis.pubsub()
    channel = f"project:{project_id}"
    pubsub.subscribe(channel)

    loop = asyncio.get_running_loop()

    try:
        while True:
            msg = await loop.run_in_executor(None, pubsub.get_message, True, 1.0)
            if not msg:
                await asyncio.sleep(0.05)
                continue
            if msg.get("type") != "message":
                continue
            data = msg["data"]
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            await ws.send_text(data)
    finally:
        try:
            pubsub.unsubscribe(channel)
            pubsub.close()
        except Exception:
            pass
