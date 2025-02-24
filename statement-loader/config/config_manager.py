import psycopg2.pool
from config.postgres import Postgres


class ConfigManager:
    postgres = Postgres(pool=psycopg2.pool.ThreadedConnectionPool(
            minconn=10, maxconn=20, user='postgres', password='',
            host='localhost', port='5432', database='finance_manager'))

