import math
import pandas as pd
import numpy as np

def is_null(value):
    return value is None or math.isnan(value) or pd.isna(value) or np.isnan(value) or (type(value) == 'str' and value.strip() == '')