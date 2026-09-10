@backend @e2e_flow
Feature: Upload a statement and exercise the full downstream transaction lifecycle

  For each supported bank/broker format: upload the fixture, confirm its
  transactions are fetchable, map one to a freshly-created category, filter
  by that category, then filter by debit/credit indicator - the same
  business scenarios a real user exercises after connecting an account,
  demonstrated against every format, not just one.

  Each fixture's transactions carry a fixed, unique-to-that-fixture calendar
  month (see scripts/generate_dummy_statement_fixtures.py) - including the
  two Axis fixtures, which otherwise share the same account - so "the
  transactions this upload produced" can be scoped by an exact date range
  even when another fixture/test has already left other data on that account.

  Scenario Outline: Uploading a v<version> <bank> <extension> statement, categorizing, and filtering its transactions
    When I upload the "<fixture>" fixture for account <account_id> user_account <user_account_id> to statement-loader
    Then the upload response has status 200 and reports success
    And <transaction_count> of the uploaded transactions are fetchable for user_account <user_account_id> between "<start_date>" and "<end_date>"
    When I map one of the uploaded transactions to a fresh category
    Then filtering user_account <user_account_id>'s transactions by that category returns only the mapped transaction
    When I filter user_account <user_account_id>'s transactions by the mapped transaction's debit/credit indicator
    Then the filtered result includes the mapped transaction

    Examples:
      | bank      | version | extension | fixture       | account_id | user_account_id | transaction_count | start_date | end_date   |
      | hdfc      | 1       | xls       | hdfc.xls      | 1          | 1               | 4                  | 2026-01-01 | 2026-01-31 |
      | icici     | 1       | xls       | icici.xls     | 2          | 2               | 4                  | 2026-02-01 | 2026-02-28 |
      | saraswat  | 1       | xls       | saraswat.xls  | 3          | 3               | 3                  | 2026-03-01 | 2026-03-31 |
      | canara    | 1       | csv       | canara.csv    | 4          | 4               | 4                  | 2026-04-01 | 2026-04-30 |
      | axis      | 1       | xls       | axis.xls      | 5          | 5               | 3                  | 2026-05-01 | 2026-05-31 |
      | axis      | 1       | csv       | axis.csv      | 5          | 5               | 4                  | 2026-06-01 | 2026-06-30 |
      | groww     | 1       | xlsx      | groww.xlsx    | 7          | 6               | 3                  | 2026-07-01 | 2026-07-31 |
