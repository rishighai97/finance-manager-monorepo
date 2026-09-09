package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class AuthBackendSteps {

    private final EnvironmentConfig environmentConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    private String requestedUsername;
    private ResponseEntity<Map> mapResponse;
    private ResponseEntity<Void> voidResponse;
    private String accessToken;

    public AuthBackendSteps(EnvironmentConfig environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    @When("I POST to api-gateway's signup endpoint with a new random username and password")
    public void i_post_to_signup() {
        requestedUsername = "backend_user_" + System.currentTimeMillis();
        Map<String, String> body = Map.of("username", requestedUsername, "password", "TestPass123!");
        mapResponse = restTemplate.postForEntity(
                environmentConfig.apiGatewayUrl() + "/auth/signup", body, Map.class);
    }

    @Then("the response has status {int} and the created user's username matches what was submitted")
    public void the_signup_response_is_successful(int expectedStatus) {
        assertThat(mapResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat(mapResponse.getBody()).containsEntry("username", requestedUsername);
    }

    @When("I POST to api-gateway's login endpoint with username {string} and password {string}")
    public void i_post_to_login(String username, String password) {
        Map<String, String> body = Map.of("username", username, "password", password);
        mapResponse = restTemplate.postForEntity(
                environmentConfig.apiGatewayUrl() + "/auth/login", body, Map.class);
    }

    @Then("the login response has status {int} and includes an access token")
    public void the_login_response_is_successful(int expectedStatus) {
        assertThat(mapResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat(mapResponse.getBody()).containsKey("accessToken");
    }

    @Given("I have logged in via the API as {string} with password {string}")
    public void i_have_logged_in_via_the_api(String username, String password) {
        i_post_to_login(username, password);
        accessToken = (String) mapResponse.getBody().get("accessToken");
    }

    @When("I POST to api-gateway's logout endpoint with that access token")
    public void i_post_to_logout() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        voidResponse = restTemplate.exchange(
                environmentConfig.apiGatewayUrl() + "/auth/logout",
                HttpMethod.POST, new HttpEntity<>(headers), Void.class);
    }

    @Then("the response has status {int}")
    public void the_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }

    public int getSignedUpUserId() {
        return (Integer) mapResponse.getBody().get("id");
    }

    public String getSignedUpUsername() {
        return requestedUsername;
    }
}
