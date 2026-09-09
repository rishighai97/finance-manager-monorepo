@backend @account
Feature: Fetch the grouped account catalog via the API

  Scenario: The grouped account catalog returns at least one group
    When I GET the grouped account catalog
    Then the response has status 200 and returns at least one group
