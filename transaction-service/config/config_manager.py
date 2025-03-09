import psycopg2.pool
from config.postgres import Postgres
import os


class ConfigManager:
    postgres = Postgres(pool=psycopg2.pool.ThreadedConnectionPool(
            minconn=10, maxconn=20, user=os.getenv("TRANSACTION_SERVICE_POSTGRES_USER"), password=os.getenv("TRANSACTION_SERVICE_POSTGRES_PASSWORD", ""),
            host=os.getenv("TRANSACTION_SERVICE_POSTGRES_HOST"), port=os.getenv("TRANSACTION_SERVICE_POSTGRES_PORT", 5432), database=os.getenv("TRANSACTION_SERVICE_POSTGRES_DATABASE")))

