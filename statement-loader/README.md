# statement-loader

Loads transactions from uploaded bank/broker account statements into the system.

## Overview
Accepts an uploaded statement file (base64-encoded in the request body), figures out which bank/broker format it is (via `account_statement` metadata in Postgres - account ID + time range + file extension + format version), parses it into `Transaction` rows with a format-specific reader, and writes them by calling `transaction-service`'s `/transaction/v1/save_all`. It talks directly to Postgres for account/account-statement lookups, and to `transaction-service` over HTTP for the actual write - it is the one backend module that both reads the DB directly *and* calls another service.

## Tech stack
- Python 3, Flask (+ `flask_cors`)
- pandas / xlrd for parsing Excel/CSV statement formats
- psycopg2 for direct Postgres access
- `requests` for calling `transaction-service`

## Local setup & run
Assumes Postgres is already running locally (see repo root README) with the `finance_manager` database.

Run these from the **repo root** (not from inside `statement-loader/`) - `--app-profile` resolves its env file via a path (`./statement-loader/resources/env_variables/.env.<profile>`) that's hardcoded relative to wherever you invoke it from (see `utils/env_utils.py`):

```bash
pip install -r statement-loader/requirements.txt
python statement-loader/run.py --app-profile local   # profiles: local, dev, qa, prod
```

Listens on port **5002** (`STATEMENT_LOADER_SERVER_PORT`, from `resources/env_variables/.env.<profile>`).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/statement/upload/v1/healthcheck` | Liveness check |
| POST | `/statement/upload/v1/` | Upload one or more account statements (base64-encoded file per request) for parsing and loading |

## Key modules
- `service/statement_reader/` - one `StatementReader` subclass per bank/broker/format (`bank_savings/`, `mutual_fund_statement/`), auto-discovered by `StatementReaderFactory` at import time and keyed by `(account_id, version, extension)`. Adding a new format is just adding a new subclass file - no manual registration - but two readers sharing a key raises at startup.
- `model/account_details_factory.py` - the enum of supported accounts (HDFC, ICICI, CANARA, AXIS, GROWW, ZERODHA, and their FD/PPF variants).
- `dao/` - direct Postgres access for `transaction` and `account_statement` lookups (SQLAlchemy/psycopg2, not calling other services for reads).

## Testing
Unit tests live under `tests/` (pytest), covering `service/statement_uploader.py`, `service/account_statement_service.py`, `service/statement_reader/statement_reader_factory.py` and `StatementReaderKey`, the HDFC statement reader (against the repo's own real sample file, `scripts/statements/HDFC.xls`), and `utils/`. Run from this directory:
```bash
pytest                          # runs the suite, enforces >=60% line coverage (pytest.ini), writes htmlcov/index.html
```
View results: pytest's own terminal summary (pass/fail per test, shown as its class/method name - `TestGetAllTransactions::test_records_failure_when_no_reader_matches` etc.) plus the `--cov-report=term-missing` table it prints inline; a browsable HTML coverage report is written to `htmlcov/index.html`. Coverage excludes `dao/`, `config/`, `model/`, `controller/`, `exception/` (thin/no-branching-logic, or - for `dao/`/`config/` - coupled to a real Postgres connection; see `tests/conftest.py`'s docstring for why) - see `.coveragerc`.

`resources/test/test.py` and `test2.py` are unrelated manual scratch scripts (require a live DB and a real statement file on disk) predating this suite - not run by pytest or CI. The `pr-checks.yml` CI job for this module currently only validates that dependencies install and the code compiles (`python -m compileall .`); it does not yet run `pytest` (see `jira/JIRA_7.md`'s Implementation notes).

## Gotchas
- `config/config_manager.py`'s `ConfigManager` opens a real Postgres connection pool (`psycopg2.pool.ThreadedConnectionPool`) as a **class attribute** - i.e. the moment that module is imported, not when anything is actually used. Since `dao/account_statement_dao.py` imports it at module scope, anything importing `service/account_statement_service.py` (or transitively, `statement_reader_factory.py`/`statement_uploader.py`) would otherwise require a live, reachable Postgres just to import it. `tests/conftest.py` works around this for the test suite by installing a fake `config.config_manager` module before anything else can import the real one - see its docstring. This is a real testability wart in the production code, not fixed here (existing-feature mode - see `jira/JIRA_7.md`).
- **Fixed bug** (found while running `test-automation`'s new per-format statement-upload scenarios repeatedly, fixed under `jira/JIRA_8.md`): `config/postgres.py`'s `Postgres.execute_queries_in_transaction` used to call `conn.close()` in its `finally` block instead of `self.pool.putconn(conn)` - closing a pooled connection directly doesn't return its slot to the pool, so every account-statement lookup permanently shrank the pool by one. After ~`maxconn` (20) requests, every subsequent one failed with `psycopg2.pool.PoolError: connection pool exhausted` until the process was restarted. Fixed by returning the connection via `putconn` instead of closing it.
- `--app-profile` will raise `Unable to load environment variable file for app profile` if run from inside `statement-loader/` itself, or from anywhere other than the repo root - see Local setup & run above.
- The historical Postgres password that used to live in these `.env.*` files has been blanked out but is still present in this repo's git history; rotate the real credential if you haven't already.
