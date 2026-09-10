# Entity-relationship diagram

The shared `finance_manager` Postgres schema, as defined in [`dbscripts/table/create/*.sql`](../../dbscripts/README.md).

## Diagram

```mermaid
erDiagram
    ACCOUNT_TYPE {
        int id PK
        varchar type_1
        varchar type_2
        varchar type_3
    }
    ACCOUNT_ICON {
        int id PK
        varchar title
        text icon
    }
    ACCOUNT {
        int id PK
        int type_id FK
        int icon_id FK
        varchar name
    }
    ACCOUNT_STATEMENT {
        int id PK
        varchar extension
        int version
        timestamp start_time
        timestamp end_time
        int account_id FK
    }
    USER_DETAIL {
        int id PK
        varchar username
        varchar password
        varchar email
        boolean is_active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    USER_ACCOUNT {
        int id PK
        int account_id FK
        int user_id FK
        varchar user_account_name
    }
    TRANSACTION {
        text id PK
        date date
        int user_account_id FK
        text title
        numeric amount
        varchar debit_credit_indicator
        numeric closing_balance
        varchar category_id
        numeric units
        numeric price_per_unit
    }
    USER_CATEGORY {
        int id PK
        int user_id FK
        varchar category_title
    }
    TRANSACTION_USER_CATEGORY {
        int id PK
        text transaction_id FK
        int user_category_id FK
    }

    ACCOUNT_TYPE ||--o{ ACCOUNT : "type_id"
    ACCOUNT_ICON ||--o{ ACCOUNT : "icon_id"
    ACCOUNT ||--o{ ACCOUNT_STATEMENT : "account_id"
    ACCOUNT ||--o{ USER_ACCOUNT : "account_id"
    USER_DETAIL ||--o{ USER_ACCOUNT : "user_id"
    USER_ACCOUNT ||--o{ TRANSACTION : "user_account_id"
    USER_DETAIL ||--o{ USER_CATEGORY : "user_id"
    TRANSACTION ||--o{ TRANSACTION_USER_CATEGORY : "transaction_id"
    USER_CATEGORY ||--o{ TRANSACTION_USER_CATEGORY : "user_category_id"
```

## Notes

- Table/column names and types are taken directly from `dbscripts/table/create/*.sql`; dependency order (`account_icon`/`account_type` -> `account` -> `account_statement`/`user_detail` -> `user_account` -> `transaction` -> `user_category` -> `transaction_user_category`) matches `dbscripts/script/setup.list` and the order documented in the root `CLAUDE.md`.
- `transaction.category_id` (a plain `varchar(200)`) is a separate, unenforced column from the `transaction_user_category` join table below it - the join table is the actual categorization mechanism used by `transaction-service`'s `/category/v1/transaction_user_category/edit_all`; `category_id` is not modeled as a foreign key here since the schema itself doesn't enforce it as one.
- `transaction.units`/`price_per_unit` are only populated for mutual-fund/broker statements (e.g. Groww) - bank-savings transactions leave them null and use `amount`/`closing_balance` instead.
- Ownership: `account`, `account_type`, `account_icon`, `user_account` belong to `account-service`; `transaction`, `user_category`, `transaction_user_category` belong to `transaction-service`; `user_detail` belongs to `api-gateway`; `account_statement` is read directly by `statement-loader` (no owning service API) - see the [high-level design](../hld/README.md).

## Kept in sync with

This diagram is derived from, and should be regenerated against, `dbscripts/table/create/*.sql` directly - not hand-maintained independently of the actual schema.
</content>
