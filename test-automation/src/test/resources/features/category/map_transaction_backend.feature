@backend @category
Feature: Map a transaction to a category via the API

  Scenario: Mapping a fresh transaction to the SALARY category
    Given a fresh transaction exists for the demo user's hdfc account
    When I map that transaction to the SALARY category
    Then the mapping response has status 200
