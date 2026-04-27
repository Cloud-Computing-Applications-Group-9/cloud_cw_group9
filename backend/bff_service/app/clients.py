from typing import Any, Optional
import httpx
from fastapi import HTTPException

from app.config import settings


_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=settings.upstream_timeout_seconds)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def call_upstream(
    method: str,
    base_url: str,
    path: str,
    *,
    json: Any = None,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
) -> tuple[int, Any]:
    """Call an upstream service and return (status_code, parsed_body).

    Network failures are converted to a 502 HTTPException so callers don't
    leak axios/httpx specifics.
    """
    url = f"{base_url.rstrip('/')}{path}"
    try:
        response = await get_client().request(
            method, url, json=json, params=params, headers=headers
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Upstream service unavailable: {exc}"
        ) from exc

    if not response.content:
        return response.status_code, None
    try:
        body = response.json()
    except ValueError:
        body = {"message": response.text}
    return response.status_code, body


def raise_for_upstream(status_code: int, body: Any) -> None:
    if status_code >= 400:
        detail = "Upstream error"
        if isinstance(body, dict):
            detail = body.get("detail") or body.get("message") or detail
        raise HTTPException(status_code=status_code, detail=detail)
