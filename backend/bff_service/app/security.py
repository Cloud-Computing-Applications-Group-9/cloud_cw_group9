from typing import Optional
from fastapi import HTTPException, Request, Response, status
from jose import JWTError, jwt

from app.config import settings


def issue_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_cookie_max_age,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.session_cookie_name, path="/")


def _decode(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        ) from exc


def get_session_token(request: Request) -> Optional[str]:
    return request.cookies.get(settings.session_cookie_name)


def require_user_id(request: Request) -> str:
    token = get_session_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    user_id = _decode(token).get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )
    return user_id


def optional_user_id(request: Request) -> Optional[str]:
    token = get_session_token(request)
    if not token:
        return None
    try:
        payload = _decode(token)
    except HTTPException:
        return None
    return payload.get("user_id")
