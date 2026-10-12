import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import ChatThread, ChatMessage, User
from backend.services.chat_engine import GroundedChatEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Grounded Chatbot"])

class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Chat message query")
    session_id: str = Field("default_session", max_length=64, pattern=r"^[a-zA-Z0-9_\-\.:]+$", description="Client conversation session ID")

@router.post("/stream")
async def chat_stream(
    payload: ChatStreamRequest,
    db: Session = Depends(get_db)
):
    """
    Real Server-Sent Events (SSE) streaming endpoint for Grounded Chatbot.
    Streams token-by-token, active tool executions, and inline verifiable citations.
    """
    message = payload.message.strip()
    session_id = payload.session_id.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    return StreamingResponse(
        GroundedChatEngine.stream_response(
            user_message=message,
            session_id=session_id,
            user=None,
            db=db
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/history")
def get_chat_history(
    session_id: str = Query("default_session", max_length=64, pattern=r"^[a-zA-Z0-9_\-\.:]+$"),
    db: Session = Depends(get_db)
):
    """
    Fetches persisted chat messages for a session.
    """
    thread = db.query(ChatThread).filter(ChatThread.session_id == session_id).first()
    if not thread:
        return []

    messages = db.query(ChatMessage).filter(
        ChatMessage.thread_id == thread.id
    ).order_by(ChatMessage.created_at.asc()).all()

    return [
        {
            "id": msg.id,
            "sender": msg.sender,
            "text": msg.content,
            "citations": msg.citations or [],
            "created_at": msg.created_at.isoformat() if msg.created_at else None
        }
        for msg in messages
    ]

@router.delete("/history")
def clear_chat_history(
    session_id: str = Query("default_session", max_length=64, pattern=r"^[a-zA-Z0-9_\-\.:]+$"),
    db: Session = Depends(get_db)
):
    """
    Clears conversation history for a session.
    """
    thread = db.query(ChatThread).filter(ChatThread.session_id == session_id).first()
    if thread:
        db.delete(thread)
        db.commit()
    return {"status": "cleared", "session_id": session_id}

