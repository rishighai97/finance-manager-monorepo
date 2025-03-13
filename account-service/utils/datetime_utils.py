from datetime import datetime

def get_datetime_or_none(datetime_string: str, format: str) -> datetime:
    try:
        return datetime.strptime(datetime_string, format)
    except ValueError:
        return None

def get_datetime_string_or_none(_datetime: datetime, format: str) -> str:
    try:
        return _datetime.strftime(format)
    except ValueError:
        return None