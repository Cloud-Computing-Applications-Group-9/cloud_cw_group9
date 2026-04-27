from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.clients import call_upstream, raise_for_upstream
from app.config import settings
from app.schemas import AuthCredentials, User, UserResponse
from app.security import (
    clear_session_cookie,
    issue_session_cookie,
    require_user_id,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _credentialed_request(path: str, body: AuthCredentials) -> dict:
    status_code, payload = await call_upstream(
        "POST",
        settings.identity_service_url,
        path,
        json=body.model_dump(),
    )
    raise_for_upstream(status_code, payload)
    if not isinstance(payload, dict) or "user_id" not in payload or "token" not in payload:
        raise HTTPException(status_code=502, detail="Invalid response from identity service")
    return payload


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: AuthCredentials, response: Response) -> UserResponse:
    payload = await _credentialed_request("/api/auth/signup", body)
    issue_session_cookie(response, payload["token"])
    return UserResponse(user=User(id=payload["user_id"], email=body.email))


@router.post("/login", response_model=UserResponse)
async def login(body: AuthCredentials, response: Response) -> UserResponse:
    payload = await _credentialed_request("/api/auth/login", body)
    issue_session_cookie(response, payload["token"])
    return UserResponse(user=User(id=payload["user_id"], email=body.email))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> Response:
    clear_session_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserResponse)
async def me(request: Request) -> UserResponse:
    user_id = require_user_id(request)
    # Identity service does not currently expose a /me endpoint, so we return
    # what we know from the token. Email is not stored in the JWT today; the
    # frontend only requires `id` to gate UI state, but we surface an empty
    # string until identity_service exposes a profile endpoint.
    return UserResponse(user=User(id=user_id, email=""))
