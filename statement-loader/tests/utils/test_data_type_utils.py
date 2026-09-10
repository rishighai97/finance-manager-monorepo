import math

import numpy as np
import pandas as pd
import pytest

from utils.data_type_utils import is_null


class TestIsNull:

    @pytest.mark.parametrize("value", [None, "", "   ", float("nan"), np.nan, pd.NA])
    def test_returns_true_for_null_like_values(self, value):
        assert is_null(value) is True

    @pytest.mark.parametrize("value", [0, "hello", "  hello  ", 1.5, False, []])
    def test_returns_false_for_non_null_values(self, value):
        assert is_null(value) is False

    def test_returns_false_for_zero_which_is_falsy_but_not_null(self):
        assert is_null(0) is False
