@backend @account
Feature: Fetch a user's linked accounts, grouped, via the API

  Scenario: The demo user's grouped linked accounts return at least one group
    When I GET the demo user's linked accounts, grouped
    Then the response has status 200 and returns at least one group
