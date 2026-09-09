@backend @account
Feature: Unlink an account from a user via the API

  Scenario: Deleting a freshly-linked account succeeds
    Given the demo user has a freshly-linked tjsb account
    When I DELETE that linked account
    Then the edit/delete response has status 200
