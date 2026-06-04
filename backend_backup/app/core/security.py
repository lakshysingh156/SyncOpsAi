"""Security helpers: API-key hashing and ingestion auth dependency."""

import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException, status

from app.core.config import settings

_API_KEY_BYTES = 32


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new ingest API key.

    Returns (full_key, prefix, key_hash). Only the hash is stored; the full key
    is shown to the user exactly once.
    """
    raw = secrets.token_urlsafe(_API_KEY_BYTES)
    full_key = f"sk_{raw}"
    prefix = full_key[:10]
    return full_key, prefix, hash_api_key(full_key)


def hash_api_key(api_key: str) -> str:
    """Return a stable SHA-256 hash of an API key for storage/comparison."""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def verify_api_key(api_key: str, key_hash: str) -> bool:
    return hmac.compare_digest(hash_api_key(api_key), key_hash)


async def require_ingest_key(x_api_key: str | None = Header(default=None)) -> str:
    """FastAPI dependency enforcing a valid ingestion API key.

    For the MVP this checks against the configured demo key. Once DB-backed
    keys are seeded (Milestone 2), this also accepts any active stored key.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )
    if hmac.compare_digest(x_api_key, settings.ingest_api_key):
        return x_api_key
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key",
    )
