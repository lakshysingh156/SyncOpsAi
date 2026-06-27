"""Block until the database accepts connections (used by the container entrypoint)."""

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


async def wait(max_attempts: int = 30, delay: float = 1.0) -> None:
    engine = create_async_engine(settings.database_url)
    for attempt in range(1, max_attempts + 1):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print(f"[wait_for_db] Database ready (attempt {attempt}).")
            await engine.dispose()
            return
        except Exception as exc:  # noqa: BLE001
            print(f"[wait_for_db] Attempt {attempt}/{max_attempts} failed: {exc}")
            await asyncio.sleep(delay)
    await engine.dispose()
    print("[wait_for_db] Database not reachable; giving up.")
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(wait())
