# Finance Manager Database Manager

A command-line utility for managing the Finance Manager database tables.

## Overview

This script helps manage PostgreSQL database tables for the Finance Manager application. It provides a convenient way to create, drop, and truncate tables individually or as a group, based on a configuration file.

## Features

- **Create Tables:** Create all tables or specify a subset of tables to create
- **Drop Tables:** Drop all tables or specify a subset of tables to drop
- **Truncate Tables:** Clear all data from all tables or a subset of tables
- **Cascading Operations:** Add CASCADE option to drop/truncate operations
- **Database Configuration:** Customize database connection parameters
- **Dependency Management:** Creates and drops tables in the correct order to respect dependencies
- **Error Handling:** Graceful handling of errors with informative messages
- **Transaction Management:** Proper transaction handling with commits and rollbacks

## Prerequisites

- Python 3.6 or higher
- psycopg2 Python package
- Access to a PostgreSQL database server

## Installation

1. Clone this repository or download the script files
2. Install required dependencies:
   ```bash
   pip install psycopg2
   ```
3. Ensure the configuration file (`finance_manager_db_config.json`) is in the same directory as the script

## Usage

The script uses command-line arguments to specify operations:

```bash
python database_manager.py [OPTIONS]
```

### Command-Line Arguments

| Argument | Description |
|----------|-------------|
| `--create-all` | Create all tables defined in the configuration file |
| `--create [TABLES]` | Create specified tables |
| `--drop-all` | Drop all tables defined in the configuration file |
| `--drop [TABLES]` | Drop specified tables |
| `--truncate-all` | Truncate all tables defined in the configuration file |
| `--truncate [TABLES]` | Truncate specified tables |
| `--cascade` | Add CASCADE to drop and truncate commands |
| `--postgres-db` | PostgreSQL database name (default: postgres) |
| `--postgres-username` | PostgreSQL username (default: postgres) |
| `--postgres-password` | PostgreSQL password (default: admin) |
| `--config-file` | Path to the table configuration JSON file (default: finance_manager_db_config.json) |

### Examples

Create all tables:
```bash
python database_manager.py --create-all
```

Create specific tables:
```bash
python database_manager.py --create account_icon account_type
```

Drop all tables:
```bash
python database_manager.py --drop-all
```

Drop specific tables with CASCADE option:
```bash
python database_manager.py --drop transaction transaction_user_category --cascade
```

Truncate all tables:
```bash
python database_manager.py --truncate-all
```

Truncate specific tables:
```bash
python database_manager.py --truncate transaction user_account
```

Using custom database connection parameters:
```bash
python database_manager.py --create-all --postgres-db postgres --postgres-username admin --postgres-password secret
```

## Configuration File

The script uses a JSON configuration file to define the tables and their creation/deletion SQL statements. The default filename is `finance_manager_db_config.json`.

Example configuration file format:
```json
[
  {
    "tableName": "account_icon",
    "createTableSql": "CREATE TABLE account_icon (...);",
    "dropTableSql": "DROP TABLE IF EXISTS account_icon;",
    "createSeqSql": "CREATE SEQUENCE IF NOT EXISTS account_icon_sequence START 1;",
    "dropSeqSql": "DROP SEQUENCE IF EXISTS account_icon_sequence;"
  },
  {
    "tableName": "account_type",
    "createTableSql": "CREATE TABLE account_type (...);",
    "dropTableSql": "DROP TABLE IF EXISTS account_type;",
    "createSeqSql": "CREATE SEQUENCE IF NOT EXISTS account_type_sequence START 1;",
    "dropSeqSql": "DROP SEQUENCE IF EXISTS account_type_sequence;"
  }
]
```

## Table Relationships

The tables are created in this order to respect dependencies:

1. account_icon
2. account_type
3. account
4. account_statement
5. user_detail
6. user_account
7. transaction
8. user_category
9. transaction_user_category

When dropping tables, the order is reversed to maintain referential integrity.

## Implementation Details

The script follows SOLID principles:

- **Single Responsibility:** Each function has a specific purpose
- **Open/Closed:** Can be extended by modifying the JSON config without changing code
- **Dependency Inversion:** Uses configuration to determine behavior

The code is structured as follows:
- Command-line argument parsing is handled in a separate function
- Database operations use common functions to execute SQL queries
- Table operations respect dependencies by processing in the correct order
- Error handling provides clear feedback about any issues encountered

## Error Handling

The script includes comprehensive error handling:
- Connection errors to the database
- Missing configuration file
- Invalid JSON in the configuration file
- SQL execution errors
- Missing tables in the configuration

## License

[MIT License](LICENSE)