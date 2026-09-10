from sqlite3 import Cursor
from typing import List
class Postgres:

    def __init__(self, pool):
        self.pool = pool
    def execute_queries_in_transaction(self, execute_queries: List):
        conn = self.pool.getconn()
        conn.autocommit = False
        try:
            # Create a cursor object using the connection
            with conn.cursor() as cur:
                # Fetch the result
                results = [execute_query(cur) for execute_query in execute_queries]
                conn.commit()
                return results
        except Exception as e:
            raise Exception("An exception occurred while querying postgres occurred: ", e)
        finally:
            # Return the connection to the pool rather than closing it - the
            # pool only ever opens minconn..maxconn real connections total,
            # so closing it directly here (instead of self.pool.putconn)
            # permanently shrinks the pool by one every call. After enough
            # requests (~maxconn) every subsequent call failed with
            # psycopg2.pool.PoolError: connection pool exhausted.
            if conn is not None:
                self.pool.putconn(conn)

    @staticmethod
    def execute_select_statement(cur, sql: str):
        cur.execute(sql)
        return cur.fetchall()