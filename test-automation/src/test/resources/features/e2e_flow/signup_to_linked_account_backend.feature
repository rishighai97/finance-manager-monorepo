@backend @e2e_flow
Feature: Sign up, link an account, and see it in the user's account list via the API

  Scenario: A brand-new user can sign up and immediately link an account
    When I POST to api-gateway's signup endpoint with a new random username and password
    And I link the tjsb account to that newly signed-up user
    Then that account appears in the newly signed-up user's linked accounts
