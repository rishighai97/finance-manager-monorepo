"""
Pytest collection-time setup shared by every test in this directory.

`config.config_manager.ConfigManager` opens a REAL Postgres connection pool
(`psycopg2.pool.ThreadedConnectionPool(minconn=10, ...)`) as a class attribute
- i.e. the instant that module is imported, not when anything is actually
used. Because `dao/account_statement_dao.py` imports it at module scope, and
`service/account_statement_service.py` -> `service/statement_reader/
statement_reader_factory.py` -> `service/statement_uploader.py` all import
that transitively, simply importing any of the modules this ticket (JIRA_7)
targets would otherwise require a live, reachable Postgres just to run any
unit test at all - exactly what our "mock the DAO layer, no live DB in unit
tests" policy (see unit-test-generate's SKILL.md) rules out.

Fix: install a fake `config.config_manager` module in `sys.modules` before
anything else gets a chance to import the real one. Its `ConfigManager.
postgres` is a MagicMock, so any accidental real DAO call fails loudly
(AttributeError/MagicMock call) instead of silently opening real connections.
This is a test-infrastructure-only workaround - no production code changes.
"""
import sys
import types
from unittest.mock import MagicMock

_fake_config_manager = types.ModuleType("config.config_manager")


class _FakeConfigManager:
    postgres = MagicMock(name="ConfigManager.postgres")


_fake_config_manager.ConfigManager = _FakeConfigManager
sys.modules["config.config_manager"] = _fake_config_manager
