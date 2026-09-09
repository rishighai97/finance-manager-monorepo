@backend @auth
Feature: Log in via the API

  Scenario: Logging in with valid credentials succeeds
    When I POST to api-gateway's login endpoint with username "Rishi Ghai" and password "admin"
    Then the login response has status 200 and includes an access token
