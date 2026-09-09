package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sample-data baseline (see dbscripts/table/insert/): account catalog has 7
 * accounts (hdfc, icici, saraswat, canara, axis, tjsb, groww) - "tjsb" is the
 * one NOT already linked to user_id=1, used here to create fresh
 * user_account rows without touching the other pre-linked sample rows.
 */
public class AccountBackendSteps {

    private static final int DEMO_USER_ID = 1;
    private static final int TJSB_ACCOUNT_ID = 6;

    private final EnvironmentConfig environmentConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    private ResponseEntity<List> listResponse;
    private ResponseEntity<Integer> saveResponse;
    private ResponseEntity<Void> voidResponse;
    private int createdUserAccountId;
    private String newAccountName;

    public AccountBackendSteps(EnvironmentConfig environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    @When("I GET the account catalog")
    public void i_get_the_account_catalog() {
        listResponse = restTemplate.getForEntity(
                environmentConfig.accountServiceUrl() + "/account/v1/fetch_all", List.class);
    }

    @Then("the response has status {int} and includes an account named {string}")
    public void the_response_includes_account_named(int expectedStatus, String accountName) {
        assertThat(listResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat((List<Map>) listResponse.getBody())
                .anyMatch(a -> accountName.equals(a.get("account_name")));
    }

    @When("I GET the grouped account catalog")
    public void i_get_the_grouped_account_catalog() {
        listResponse = restTemplate.getForEntity(
                environmentConfig.accountServiceUrl() + "/account/v1/fetch_all/grouped", List.class);
    }

    @Then("the response has status {int} and returns at least one group")
    public void the_response_has_at_least_one_group(int expectedStatus) {
        assertThat(listResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat(listResponse.getBody()).isNotEmpty();
    }

    @When("I POST to link the tjsb account to the demo user")
    public void i_post_to_link_the_tjsb_account() {
        newAccountName = "TJSB backend test " + System.currentTimeMillis();
        Map<String, Object> body = Map.of(
                "user_id", DEMO_USER_ID,
                "account_id", TJSB_ACCOUNT_ID,
                "user_account_name", newAccountName);
        saveResponse = restTemplate.postForEntity(
                environmentConfig.accountServiceUrl() + "/user_account/v1/save", body, Integer.class);
        createdUserAccountId = saveResponse.getBody();
    }

    @Then("the response has status {int} and a new user_account id is returned")
    public void the_response_returns_a_new_id(int expectedStatus) {
        assertThat(saveResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat(createdUserAccountId).isPositive();
    }

    @Given("the demo user has a freshly-linked tjsb account")
    public void the_demo_user_has_a_freshly_linked_tjsb_account() {
        i_post_to_link_the_tjsb_account();
    }

    @When("I PUT a new name for that linked account")
    public void i_put_a_new_name_for_that_linked_account() {
        String updatedName = "TJSB renamed " + System.currentTimeMillis();
        Map<String, Object> body = Map.of(
                "user_account_id", createdUserAccountId,
                "new_user_account_name", updatedName);
        voidResponse = restTemplate.exchange(
                environmentConfig.accountServiceUrl() + "/user_account/v1/edit",
                HttpMethod.PUT, new HttpEntity<>(body), Void.class);
    }

    @When("I DELETE that linked account")
    public void i_delete_that_linked_account() {
        voidResponse = restTemplate.exchange(
                environmentConfig.accountServiceUrl() + "/user_account/v1/delete?user_account_id=" + createdUserAccountId,
                HttpMethod.DELETE, HttpEntity.EMPTY, Void.class);
    }

    @Then("the edit\\/delete response has status {int}")
    public void the_edit_delete_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }

    @When("I GET the demo user's linked accounts")
    public void i_get_the_demo_users_linked_accounts() {
        listResponse = restTemplate.getForEntity(
                environmentConfig.accountServiceUrl() + "/user_account/v1/fetch_all?user_ids=" + DEMO_USER_ID, List.class);
    }

    @Then("the response has status {int} and includes a linked account named {string}")
    public void the_response_includes_linked_account_named(int expectedStatus, String accountDisplayName) {
        assertThat(listResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        assertThat((List<Map>) listResponse.getBody())
                .anyMatch(a -> accountDisplayName.equals(a.get("user_account_name")));
    }

    @When("I GET the demo user's linked accounts, grouped")
    public void i_get_the_demo_users_linked_accounts_grouped() {
        listResponse = restTemplate.getForEntity(
                environmentConfig.accountServiceUrl() + "/user_account/v1/fetch_all/grouped?user_ids=" + DEMO_USER_ID, List.class);
    }
}
