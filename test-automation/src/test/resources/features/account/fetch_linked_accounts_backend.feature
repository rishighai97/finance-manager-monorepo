@backend @account
Feature: Fetch a user's linked accounts via the API

  Scenario: The demo user's linked accounts include the known sample link
    When I GET the demo user's linked accounts
    Then the response has status 200 and includes a linked account named "HDFC RISHI"
