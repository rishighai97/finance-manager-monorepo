from datetime import datetime

import pytest

from utils.datetime_utils import validate_datetime, parse_flexible_date


class TestValidateDatetime:

    def test_returns_true_for_a_string_matching_the_format(self):
        assert validate_datetime("2026-09-09", "%Y-%m-%d") is True

    def test_returns_false_for_a_string_not_matching_the_format(self):
        assert validate_datetime("09/09/2026", "%Y-%m-%d") is False

    def test_returns_false_for_an_empty_string(self):
        assert validate_datetime("", "%Y-%m-%d") is False


class TestParseFlexibleDate:

    def test_matches_the_first_format_in_the_list(self):
        result = parse_flexible_date("09/09/2026", ["%d/%m/%Y", "%d-%m-%Y"])
        assert result == datetime(2026, 9, 9)

    def test_falls_back_to_a_later_format_when_the_first_does_not_match(self):
        result = parse_flexible_date("09-09-2026", ["%d/%m/%Y", "%d-%m-%Y"])
        assert result == datetime(2026, 9, 9)

    def test_strips_surrounding_whitespace_before_matching(self):
        result = parse_flexible_date("  09/09/2026  ", ["%d/%m/%Y"])
        assert result == datetime(2026, 9, 9)

    def test_raises_when_no_format_matches(self):
        with pytest.raises(ValueError):
            parse_flexible_date("2026.09.09", ["%d/%m/%Y", "%d-%m-%Y"])
