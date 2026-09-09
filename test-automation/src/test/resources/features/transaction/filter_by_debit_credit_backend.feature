@backend @transaction
Feature: Filter transactions by debit/credit indicator via the API

  Scenario: Filtering to debit only excludes the credit transaction
    Given the demo user has one fresh debit and one fresh credit transaction today
    When I GET the demo user's transactions filtered to debit only
    Then only the debit transaction is returned
