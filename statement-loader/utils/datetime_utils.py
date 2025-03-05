from datetime import datetime

def validate_datetime(datetime_string: str, format: str):
    try:
        datetime.strptime(datetime_string, format)
    except ValueError:
        raise ValueError(f"Incorrect data format, should be {format}")
