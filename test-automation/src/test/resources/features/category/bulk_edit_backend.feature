@backend @category
Feature: Bulk-edit existing categories via the API

  Scenario: Renaming two freshly-created categories in one request
    Given the demo user has 2 freshly-created categories
    When I PUT updated titles for those categories
    Then the category edit response has status 200
    And the updated titles are visible when fetching the demo user's categories
