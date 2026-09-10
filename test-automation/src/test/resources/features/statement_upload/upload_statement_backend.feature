@backend @statement_upload
Feature: Upload each supported bank/broker statement format via the API

  Every row below is a synthetic fixture (test-automation/src/test/resources/fixtures/statements/,
  see jira/JIRA_8.md) shaped to match that specific statement-loader reader's
  real parsing logic - not a real personal statement.

  Scenario Outline: Uploading a v<version> <bank> <extension> statement succeeds
    When I upload the "<fixture>" fixture for account <account_id> user_account <user_account_id> to statement-loader
    Then the upload response has status 200 and reports success

    Examples:
      | bank      | version | extension | fixture       | account_id | user_account_id |
      | hdfc      | 1       | xls       | hdfc.xls      | 1          | 1               |
      | icici     | 1       | xls       | icici.xls     | 2          | 2               |
      | saraswat  | 1       | xls       | saraswat.xls  | 3          | 3               |
      | canara    | 1       | csv       | canara.csv    | 4          | 4               |
      | axis      | 1       | xls       | axis.xls      | 5          | 5               |
      | axis      | 1       | csv       | axis.csv      | 5          | 5               |
      | groww     | 1       | xlsx      | groww.xlsx    | 7          | 6               |
      | hdfc      | 1       | pdf       | hdfc.pdf      | 1          | 1               |
