# Sequence diagrams

Step-by-step flow for finance-manager's key UI-driven actions. Each diagram covers one business-level action a user takes in `finance-manager-ui`, across whichever services/database it actually touches - see the [high-level design](../hld/README.md) for the static picture these flows move through.

## Upload a statement

Uploading a bank/broker statement file, parsing it, and persisting the resulting transactions.

```mermaid
sequenceDiagram
    actor User
    participant UI as finance-manager-ui
    participant SL as statement-loader
    participant DB as Postgres
    participant TXN as transaction-service

    User->>UI: Select account + statement file
    UI->>SL: POST /statement/upload/v1/ (base64 file)
    SL->>DB: Look up account_statement (account_id, time range, extension, version)
    DB-->>SL: Matching format metadata
    SL->>SL: Parse file with the resolved StatementReader
    SL->>TXN: POST /transaction/v1/save_all (parsed transactions)
    TXN->>DB: Insert transaction rows
    DB-->>TXN: OK
    TXN-->>SL: 200 OK
    SL-->>UI: Upload result (transaction count / errors)
    UI-->>User: Show upload result
```

## Categorize a transaction

Mapping an uploaded transaction to a user-defined category.

```mermaid
sequenceDiagram
    actor User
    participant UI as finance-manager-ui
    participant TXN as transaction-service
    participant DB as Postgres

    UI->>TXN: GET /category/v1/fetch_all?user_ids=
    TXN->>DB: Select user_category
    DB-->>TXN: Categories
    TXN-->>UI: Categories
    User->>UI: Pick a category for a transaction
    UI->>TXN: PUT /category/v1/transaction_user_category/edit_all (INSERT mapping)
    TXN->>DB: Insert transaction_user_category row
    DB-->>TXN: OK
    TXN-->>UI: 200 OK
```

## Filter transactions

Fetching a user's transactions filtered by category and/or debit/credit indicator.

```mermaid
sequenceDiagram
    actor User
    participant UI as finance-manager-ui
    participant TXN as transaction-service
    participant DB as Postgres

    User->>UI: Set filters (date range, category, debit/credit)
    UI->>TXN: GET /transaction/v1/fetch_all?user_account_ids=&start_date=&end_date=&category_ids=&debit_credit_indicator=
    TXN->>DB: Select transaction (joined to transaction_user_category when category_ids is set)
    DB-->>TXN: Filtered rows
    TXN-->>UI: Filtered transactions
    UI-->>User: Render filtered list
```

## Signup / login

`api-gateway`'s own auth flow - distinct from the other three flows because it's the one path that touches `user_detail` instead of the account/transaction domain.

```mermaid
sequenceDiagram
    actor User
    participant UI as finance-manager-ui
    participant GW as api-gateway
    participant DB as Postgres

    User->>UI: Enter username + password (signup)
    UI->>GW: POST /auth/signup
    GW->>DB: Check username uniqueness, insert user_detail (BCrypt-hashed password)
    DB-->>GW: Created
    GW-->>UI: 200 OK

    User->>UI: Enter username + password (login)
    UI->>GW: POST /auth/login
    GW->>DB: Select user_detail by username
    DB-->>GW: Row
    GW->>GW: Verify BCrypt hash, generate token (in-memory map, not a real JWT)
    GW-->>UI: Access/refresh token pair
    UI->>UI: auth-inteceptor.service.ts attaches token to subsequent requests
```

## Kept in sync with

Each diagram is derived from, and should be regenerated against, the relevant module's `Endpoints` table and `Overview`/`Gotchas` sections (`statement-loader`, `transaction-service`, `api-gateway` READMEs) plus `finance-manager-ui`'s `src/service/*.service.ts` clients - not hand-maintained independently of them.
</content>
