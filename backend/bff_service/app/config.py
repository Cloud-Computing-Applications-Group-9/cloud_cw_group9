import os


class Settings:
    port: int = int(os.getenv("PORT", "8080"))

    identity_service_url: str = os.getenv(
        "IDENTITY_SERVICE_URL", "http://identity_service:8000"
    )
    salary_service_url: str = os.getenv(
        "SALARY_SERVICE_URL", "http://salary_service:8000"
    )
    vote_service_url: str = os.getenv(
        "VOTE_SERVICE_URL", "http://vote_service:8000"
    )
    search_service_url: str = os.getenv(
        "SEARCH_SERVICE_URL", "http://search_service:8000"
    )

    jwt_secret: str = os.getenv("JWT_SECRET", "your_jwt_secret")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")

    session_cookie_name: str = os.getenv("SESSION_COOKIE_NAME", "session")
    session_cookie_max_age: int = int(os.getenv("SESSION_COOKIE_MAX_AGE", "3600"))
    session_cookie_secure: bool = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    session_cookie_samesite: str = os.getenv("SESSION_COOKIE_SAMESITE", "lax")

    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

    upstream_timeout_seconds: float = float(os.getenv("UPSTREAM_TIMEOUT", "10"))
    default_page_size: int = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))


settings = Settings()
