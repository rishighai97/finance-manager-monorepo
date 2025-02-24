import psycopg2.pool
from config.postgres import Postgres
import os


class ConfigManager:
    postgres = Postgres(pool=psycopg2.pool.ThreadedConnectionPool(
            minconn=10, maxconn=20, user=os.getenv("POSTGRES_USER"), password=os.getenv("POSTGRES_PASSWORD", ""),
            host=os.getenv("POSTGRES_HOST"), port=os.getenv("POSTGRES_PORT", 5432), database=os.getenv("POSTGRES_DATABASE")))

