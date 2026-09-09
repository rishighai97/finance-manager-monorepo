@backend @category
Feature: Bulk-create several categories at once via the API

  Scenario: Creating three categories in one request
    When I POST to bulk-create 3 new categories
    Then the category save response has status 200
    And all 3 new categories are visible when fetching the demo user's categories
