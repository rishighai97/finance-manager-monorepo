@backend @account
Feature: Link an existing account to a user via the API

  Scenario: Linking the tjsb account to the demo user succeeds
    When I POST to link the tjsb account to the demo user
    Then the response has status 200 and a new user_account id is returned
