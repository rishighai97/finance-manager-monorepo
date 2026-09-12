from datetime import datetime
from typing import List

def validate_datetime(datetime_string: str, format: str):
    try:
        datetime.strptime(datetime_string, format)
        return True
    except ValueError:
        return False


def parse_flexible_date(date_string: str, formats: List[str]) -> datetime:
    """Tries each format in order, returning the first successful parse.

    Lets a reader tolerate small format drift (2- vs 4-digit year,
    "/" vs "-" separators) in a real bank/broker export without crashing
    outright, while keeping day/month-order convention (day-first for
    Indian banks, month-first for Amex) fixed per reader - callers must
    only ever pass formats that share the same day/month order, since
    trying both would silently misinterpret an ambiguous date (e.g.
    01/02) rather than raising.
    """
    date_string = date_string.strip()
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    raise ValueError(
        f"date {date_string!r} did not match any of the expected formats: {formats}"
    )