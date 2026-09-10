from utils.datetime_utils import validate_datetime


class TestValidateDatetime:

    def test_returns_true_for_a_string_matching_the_format(self):
        assert validate_datetime("2026-09-09", "%Y-%m-%d") is True

    def test_returns_false_for_a_string_not_matching_the_format(self):
        assert validate_datetime("09/09/2026", "%Y-%m-%d") is False

    def test_returns_false_for_an_empty_string(self):
        assert validate_datetime("", "%Y-%m-%d") is False
