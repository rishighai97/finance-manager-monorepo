@backend @account
Feature: Fetch the full account catalog via the API

  Scenario: The account catalog includes the known sample accounts
    When I GET the account catalog
    Then the response has status 200 and includes an account named "hdfc"
