import asyncio
import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from backend.services.broadcaster import _active_connections, broadcast_live_event, notify_live_event

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Live Events"])

@router.get("/events/stream")
async def stream_live_events(request: Request):
    """
    Server-Sent Events (SSE) stream endpoint for real-time live telemetry ticker & dashboard updates.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _active_connections.add(queue)

    async def event_generator():
        try:
            greeting = json.dumps({
                "event": "connected",
                "data": {"status": "LIVE_STREAM_ACTIVE", "message": "Connected to RevivePay Real-Time Telemetry Stream"}
            })
            yield f"event: connected\ndata: {greeting}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=10.0)
                    yield message
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except (asyncio.CancelledError, Exception):
            pass
        finally:
            _active_connections.discard(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
