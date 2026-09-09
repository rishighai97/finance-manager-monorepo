@backend @transaction
Feature: Filter transactions by category via the API

  Scenario: Filtering by the SALARY category returns only the mapped transaction
    Given the demo user has one fresh debit and one fresh credit transaction today
    And one of those transactions is mapped to the SALARY category
    When I GET the demo user's transactions filtered by the SALARY category
    Then only the SALARY-mapped transaction is returned
