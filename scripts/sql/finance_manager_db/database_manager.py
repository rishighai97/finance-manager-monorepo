#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import List, Dict, Any, Optional, Tuple

# Try to import psycopg2-binary

try:
    import psycopg2
except ImportError:
    print("Error: psycopg2 module not found.")
    print("Please install the package with: pip install psycopg2-binary")
    sys.exit(1)


class Environment:
    # Database connection parameters
    postgres_db = "postgres"
    postgres_username = "postgres"
    postgres_password = "admin"
    db_name = "finance_manager"

    # Operation flags
    create_all = False
    create_tables = []
    drop_all = False
    drop_tables = []
    truncate_all = False
    truncate_tables = []
    cascade = False

    # Config file
    config_file = "finance_manager_db_config.json"


def parse_arguments() -> None:
    """Parse command line arguments and set values in Environment class."""
    parser = argparse.ArgumentParser(description="Database table management script")

    # Database connection options
    parser.add_argument("--postgres-db", help="Postgres database name (default: postgres)", default="postgres")
    parser.add_argument("--postgres-username", help="Postgres username (default: postgres)", default="postgres")
    parser.add_argument("--postgres-password", help="Postgres password (default: admin)", default="admin")

    # Operation groups
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--create-all", action="store_true", help="Create all tables")
    group.add_argument("--create", nargs="+", metavar="TABLE", help="Create specified tables")
    group.add_argument("--drop-all", action="store_true", help="Drop all tables")
    group.add_argument("--drop", nargs="+", metavar="TABLE", help="Drop specified tables")
    group.add_argument("--truncate-all", action="store_true", help="Truncate all tables")
    group.add_argument("--truncate", nargs="+", metavar="TABLE", help="Truncate specified tables")

    # Additional options
    parser.add_argument("--cascade", action="store_true", help="Add CASCADE to drop commands")
    parser.add_argument("--config-file", default="finance_manager_db_config.json",
                        help="Path to the table configuration JSON file")

    args = parser.parse_args()

    # Set database connection parameters
    Environment.postgres_db = args.postgres_db
    Environment.postgres_username = args.postgres_username
    Environment.postgres_password = args.postgres_password

    # Set operation flags
    Environment.create_all = args.create_all
    Environment.drop_all = args.drop_all
    Environment.truncate_all = args.truncate_all
    Environment.cascade = args.cascade
    Environment.config_file = args.config_file

    # Set table lists if provided
    if args.create:
        Environment.create_tables = args.create
    if args.drop:
        Environment.drop_tables = args.drop
    if args.truncate:
        Environment.truncate_tables = args.truncate


def load_config() -> List[Dict[str, Any]]:
    """Load table configuration from JSON file."""
    try:
        with open(Environment.config_file, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print(f"Error: Configuration file '{Environment.config_file}' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Configuration file '{Environment.config_file}' is not valid JSON.")
        sys.exit(1)


def get_db_connection(database: str = None) -> Tuple[psycopg2.extensions.connection, psycopg2.extensions.cursor]:
    """Create a connection to the PostgreSQL database."""
    db_name = database if database else Environment.postgres_db

    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=Environment.postgres_username,
            password=Environment.postgres_password,
            host="localhost"  # Assuming local connection
        )
        cur = conn.cursor()
        return conn, cur
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)


def execute_query(cursor: psycopg2.extensions.cursor, conn: psycopg2.extensions.connection,
                  query: str, description: str = None) -> None:
    """Execute a SQL query and handle errors."""
    if description:
        print(description)

    try:
        cursor.execute(query)
        conn.commit()
        print("Query executed successfully.")
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error executing query: {e}")


def create_database_if_not_exists() -> None:
    """Create the finance_manager database if it doesn't exist."""
    conn, cur = get_db_connection()

    try:
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (Environment.db_name,))
        exists = cur.fetchone()

        if not exists:
            # Close current transaction
            conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)

            print(f"Creating database '{Environment.db_name}'...")
            cur.execute(f"CREATE DATABASE {Environment.db_name}")
            print(f"Database '{Environment.db_name}' created successfully.")
        else:
            print(f"Database '{Environment.db_name}' already exists.")

    except psycopg2.Error as e:
        print(f"Error checking/creating database: {e}")
    finally:
        cur.close()
        conn.close()


def create_tables(table_configs: List[Dict[str, Any]], tables_to_create: List[str] = None) -> None:
    """Create specified tables or all tables based on configuration."""
    create_database_if_not_exists()
    conn, cur = get_db_connection(Environment.db_name)

    try:
        # Determine which tables to create
        if tables_to_create:
            filtered_configs = [config for config in table_configs
                                if config.get('tableName') in tables_to_create]

            if not filtered_configs:
                print("Error: None of the specified tables found in configuration.")
                return

            configs_to_use = filtered_configs
        else:
            # Create all tables
            configs_to_use = table_configs

        # Create tables in the correct order
        for config in configs_to_use:
            table_name = config.get('tableName')
            create_seq_sql = config.get('createSeqSql')
            create_table_sql = config.get('createTableSql')

            if create_seq_sql:
                execute_query(cur, conn, create_seq_sql, f"Creating sequence for table '{table_name}'...")

            if create_table_sql:
                execute_query(cur, conn, create_table_sql, f"Creating table '{table_name}'...")
            else:
                print(f"Warning: No SQL found for creating table '{table_name}'")

        print("Table creation complete.")

    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        cur.close()
        conn.close()


def drop_tables(table_configs: List[Dict[str, Any]], tables_to_drop: List[str] = None) -> None:
    """Drop specified tables or all tables based on configuration."""
    conn, cur = get_db_connection(Environment.db_name)

    try:
        # Determine which tables to drop
        if tables_to_drop:
            filtered_configs = [config for config in table_configs
                                if config.get('tableName') in tables_to_drop]

            if not filtered_configs:
                print("Error: None of the specified tables found in configuration.")
                return

            configs_to_use = filtered_configs
        else:
            # Drop all tables
            configs_to_use = table_configs

        # Drop tables in reverse order to respect dependencies
        for config in reversed(configs_to_use):
            table_name = config.get('tableName')
            drop_table_sql = config.get('dropTableSql')
            drop_seq_sql = config.get('dropSeqSql')

            # Add CASCADE if specified
            if Environment.cascade and drop_table_sql:
                # Check if CASCADE is already in the SQL
                if "CASCADE" not in drop_table_sql.upper():
                    drop_table_sql = drop_table_sql.rstrip(';') + " CASCADE;"

            if drop_table_sql:
                execute_query(cur, conn, drop_table_sql, f"Dropping table '{table_name}'...")
            else:
                print(f"Warning: No SQL found for dropping table '{table_name}'")

            if drop_seq_sql:
                if Environment.cascade and "CASCADE" not in drop_seq_sql.upper():
                    drop_seq_sql = drop_seq_sql.rstrip(';') + " CASCADE;"

                execute_query(cur, conn, drop_seq_sql, f"Dropping sequence for table '{table_name}'...")

        print("Table dropping complete.")

    except Exception as e:
        print(f"Error dropping tables: {e}")
    finally:
        cur.close()
        conn.close()


def truncate_tables(table_configs: List[Dict[str, Any]], tables_to_truncate: List[str] = None) -> None:
    """Truncate specified tables or all tables."""
    conn, cur = get_db_connection(Environment.db_name)

    try:
        # Determine which tables to truncate
        if tables_to_truncate:
            table_names = tables_to_truncate
        else:
            # Truncate all tables
            table_names = [config.get('tableName') for config in table_configs]

        # Construct a single TRUNCATE statement for all tables
        if table_names:
            table_list = ', '.join(table_names)
            cascade_str = " CASCADE" if Environment.cascade else ""

            truncate_sql = f"TRUNCATE TABLE {table_list}{cascade_str};"
            execute_query(cur, conn, truncate_sql, f"Truncating tables: {table_list}...")

            print("Table truncation complete.")
        else:
            print("No tables to truncate.")

    except Exception as e:
        print(f"Error truncating tables: {e}")
    finally:
        cur.close()
        conn.close()


def main() -> None:
    """Main entry point of the script."""
    parse_arguments()

    # Load table configuration
    table_configs = load_config()

    # Execute requested operation
    if Environment.create_all:
        create_tables(table_configs)
    elif Environment.create_tables:
        create_tables(table_configs, Environment.create_tables)
    elif Environment.drop_all:
        drop_tables(table_configs)
    elif Environment.drop_tables:
        drop_tables(table_configs, Environment.drop_tables)
    elif Environment.truncate_all:
        truncate_tables(table_configs)
    elif Environment.truncate_tables:
        truncate_tables(table_configs, Environment.truncate_tables)


if __name__ == "__main__":
    main()