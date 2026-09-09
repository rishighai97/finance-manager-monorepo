@backend @category
Feature: Create a single category via the API

  Scenario: Creating exactly one category
    When I POST to bulk-create 1 new categories
    Then the category save response has status 200
    And all 1 new categories are visible when fetching the demo user's categories
