import math
import pandas as pd
import numpy as np

def is_null(value):
    # Check for None
    if value is None:
        return True
    # Check for string empty or whitespace
    if isinstance(value, str):
        return value.strip() == ''
    # Check for pandas/numpy NA/NaN
    try:
        if pd.isna(value):
            return True
    except Exception:
        pass
    try:
        if np.isnan(value):
            return True
    except Exception:
        pass
    # Check for float('nan')
    try:
        if isinstance(value, float) and math.isnan(value):
            return True
    except Exception:
        pass
    return False