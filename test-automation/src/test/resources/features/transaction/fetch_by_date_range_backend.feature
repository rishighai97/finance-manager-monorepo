@backend @transaction
Feature: Fetch a user's transactions in a date range via the API

  Scenario: Fetching today's transactions returns freshly-created ones
    Given the demo user has one fresh debit and one fresh credit transaction today
    When I GET the demo user's transactions for today
    Then the fetch response includes both fresh transactions
