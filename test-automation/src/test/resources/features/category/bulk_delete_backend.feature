@backend @category
Feature: Bulk-delete categories via the API

  Scenario: Deleting two freshly-created categories in one request
    Given the demo user has 2 freshly-created categories
    When I DELETE those categories in bulk
    Then the category delete response has status 200
    And those categories no longer appear when fetching the demo user's categories
