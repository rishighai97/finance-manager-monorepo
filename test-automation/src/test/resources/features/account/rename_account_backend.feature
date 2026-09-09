@backend @account
Feature: Rename a user's linked account via the API

  Scenario: Renaming a freshly-linked account succeeds
    Given the demo user has a freshly-linked tjsb account
    When I PUT a new name for that linked account
    Then the edit/delete response has status 200
