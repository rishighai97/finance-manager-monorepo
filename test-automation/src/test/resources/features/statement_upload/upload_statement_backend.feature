@backend @statement_upload
Feature: Upload a bank statement and have it parsed via the API

  Scenario: Uploading the sample HDFC statement succeeds
    When I POST the sample HDFC statement to statement-loader
    Then the upload response has status 200 and reports success
