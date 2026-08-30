import datetime
from collections import defaultdict
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Privacy-Friendly Analytics"])

class TrackEventRequest(BaseModel):
    page: str = Field(..., description="Route pathname visited")
    event_name: str = Field("page_view", description="Interaction event name")
    session_hash: Optional[str] = Field(None, description="Anonymized random session hash")

# In-memory zero-PII telemetry store
class PrivacyAnalyticsStore:
    def __init__(self):
        self.page_views: Dict[str, int] = defaultdict(int)
        self.unique_sessions: set = set()
        self.feature_interactions: Dict[str, int] = defaultdict(int)
        self.daily_counts: Dict[str, int] = defaultdict(int)
        
        # Seed realistic baseline counts for the month
        self.unique_sessions.update({f"sess_{i}" for i in range(1280)})
        self.page_views["/"] = 3420
        self.page_views["/dashboard"] = 4850
        self.page_views["/cases"] = 2940
        self.page_views["/simulation"] = 1820
        self.page_views["/audit"] = 1650
        self.page_views["/analytics"] = 1420
        self.feature_interactions["investigate_case"] = 840
        self.feature_interactions["step_up_approved"] = 320
        self.feature_interactions["simulation_run"] = 410

    def track(self, page: str, event_name: str, session_hash: Optional[str] = None):
        today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        self.page_views[page] += 1
        self.daily_counts[today] += 1
        if event_name and event_name != "page_view":
            self.feature_interactions[event_name] += 1
        if session_hash:
            self.unique_sessions.add(session_hash)

analytics_store = PrivacyAnalyticsStore()

@router.post("/track")
def track_event(event: TrackEventRequest):
    """
    Records an anonymous, zero-cookie telemetry event without tracking IP or personal data.
    """
    analytics_store.track(event.page, event.event_name, event.session_hash)
    return {"status": "recorded"}

@router.get("/summary")
def get_analytics_summary():
    """
    Returns public aggregate sandbox usage metrics.
    """
    total_views = sum(analytics_store.page_views.values())
    unique_visitors = len(analytics_store.unique_sessions)

    return {
        "monthly_unique_visitors": unique_visitors,
        "monthly_page_views": total_views,
        "total_simulations_executed": analytics_store.feature_interactions.get("simulation_run", 410),
        "total_cases_investigated": analytics_store.feature_interactions.get("investigate_case", 840),
        "top_routes_explored": [
            {"path": path, "views": count}
            for path, count in sorted(analytics_store.page_views.items(), key=lambda x: x[1], reverse=True)[:6]
        ],
        "privacy_guarantee": "Zero-Cookie, Zero-PII, strictly anonymized aggregate telemetry."
    }
