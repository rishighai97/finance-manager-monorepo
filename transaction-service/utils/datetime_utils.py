from datetime import datetime

def validate_datetime(datetime_string: str, format: str):
    try:
        datetime.strptime(datetime_string, format)
        return True
    except ValueError:
        return False