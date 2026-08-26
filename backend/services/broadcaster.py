import asyncio
import json
import logging
from typing import Set

logger = logging.getLogger(__name__)

# In-memory active SSE subscriber queues
_active_connections: Set[asyncio.Queue] = set()

def get_active_connections() -> Set[asyncio.Queue]:
    return _active_connections

async def broadcast_live_event(event_type: str, data: dict):
    """
    Asynchronously broadcasts an event to all connected SSE clients.
    """
    if not _active_connections:
        return

    payload = json.dumps({"event": event_type, "data": data})
    message = f"event: {event_type}\ndata: {payload}\n\n"

    dead_connections = set()
    for queue in _active_connections:
        try:
            queue.put_nowait(message)
        except Exception:
            dead_connections.add(queue)

    for dead in dead_connections:
        _active_connections.discard(dead)

def notify_live_event(event_type: str, data: dict):
    """
    Synchronous helper to schedule a broadcast on the running asyncio loop if one exists.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(broadcast_live_event(event_type, data))
        else:
            loop.run_until_complete(broadcast_live_event(event_type, data))
    except Exception as e:
        logger.debug(f"Could not broadcast live event: {e}")
