@backend @auth
Feature: Log out via the API

  Scenario: Logging out invalidates the session token
    Given I have logged in via the API as "Rishi Ghai" with password "admin"
    When I POST to api-gateway's logout endpoint with that access token
    Then the response has status 200
