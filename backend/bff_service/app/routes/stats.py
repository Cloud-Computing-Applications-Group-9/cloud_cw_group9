from typing import Optional
from fastapi import APIRouter, Query

from app.clients import call_upstream, raise_for_upstream
from app.config import settings

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
async def get_stats(
    role: Optional[str] = Query(default=None),
    experience_level: Optional[str] = Query(default=None),
    country: Optional[str] = Query(default=None),
    currency: Optional[str] = Query(default=None),
):
    params: dict = {}
    if role:
        params["role"] = role
    if experience_level:
        params["experience_level"] = experience_level
    if country:
        params["country"] = country
    if currency:
        params["currency"] = currency

    status_code, payload = await call_upstream(
        "GET",
        settings.stats_service_url,
        "/stats",
        params=params or None,
    )
    raise_for_upstream(status_code, payload)
    return payload
