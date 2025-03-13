import psycopg2.pool
from config.postgres import Postgres
import os

# fixme analyze starvation issue when maxconn = 20. Fix db connection pool
class ConfigManager:
    postgres = Postgres(pool=psycopg2.pool.ThreadedConnectionPool(
            minconn=10, maxconn=200, user=os.getenv("ACCOUNT_SERVICE_POSTGRES_USER"), password=os.getenv("ACCOUNT_SERVICE_POSTGRES_PASSWORD", ""),
            host=os.getenv("ACCOUNT_SERVICE_POSTGRES_HOST"), port=os.getenv("ACCOUNT_SERVICE_POSTGRES_PORT", 5432), database=os.getenv("ACCOUNT_SERVICE_POSTGRES_DATABASE")))

