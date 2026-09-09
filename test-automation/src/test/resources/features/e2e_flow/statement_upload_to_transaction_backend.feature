@backend @e2e_flow
Feature: Upload a statement and see its transactions appear via the API

  Scenario: Uploading the sample HDFC statement makes its transactions fetchable
    When I POST the sample HDFC statement to statement-loader
    Then the upload response has status 200 and reports success
    And the sample HDFC statement's transactions appear when fetching the demo user's transactions
