from typing import Optional


def short_id(value: Optional[str]) -> str:
    return value[:8] if value else "-"
