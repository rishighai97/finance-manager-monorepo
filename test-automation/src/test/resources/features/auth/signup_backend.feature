@backend @auth
Feature: Sign up a new user via the API
  As a client of api-gateway
  I want to create a user directly via POST /auth/signup
  So that the signup capability works independent of the UI

  Scenario: Signing up with a new username succeeds
    When I POST to api-gateway's signup endpoint with a new random username and password
    Then the response has status 200 and the created user's username matches what was submitted
