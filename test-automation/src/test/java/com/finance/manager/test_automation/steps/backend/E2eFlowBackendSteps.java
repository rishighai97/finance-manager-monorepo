package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cross-service flows spanning more than one backend service - kept
 * self-contained (some overlap with AccountBackendSteps/StatementUploadBackendSteps)
 * rather than cross-calling their private helpers, since these scenarios are
 * about the flow as a whole, not reusing another test's exact assertions.
 */
public class E2eFlowBackendSteps {

    private static final int TJSB_ACCOUNT_ID = 6;
    private static final int HDFC_ACCOUNT_ID = 1;
    private static final int HDFC_USER_ACCOUNT_ID = 1;

    private final EnvironmentConfig environmentConfig;
    private final AuthBackendSteps authBackendSteps;
    private final StatementUploadBackendSteps statementUploadBackendSteps;
    private final RestTemplate restTemplate = new RestTemplate();

    private int newUserAccountId;
    private String newAccountName;

    public E2eFlowBackendSteps(EnvironmentConfig environmentConfig, AuthBackendSteps authBackendSteps,
                                StatementUploadBackendSteps statementUploadBackendSteps) {
        this.environmentConfig = environmentConfig;
        this.authBackendSteps = authBackendSteps;
        this.statementUploadBackendSteps = statementUploadBackendSteps;
    }

    @When("I link the tjsb account to that newly signed-up user")
    public void i_link_tjsb_to_newly_signed_up_user() {
        int newUserId = authBackendSteps.getSignedUpUserId();
        newAccountName = "E2E onboarding test " + System.currentTimeMillis();
        Map<String, Object> body = Map.of(
                "user_id", newUserId,
                "account_id", TJSB_ACCOUNT_ID,
                "user_account_name", newAccountName);
        ResponseEntity<Integer> response = restTemplate.postForEntity(
                environmentConfig.accountServiceUrl() + "/user_account/v1/save", body, Integer.class);
        newUserAccountId = response.getBody();
    }

    @Then("that account appears in the newly signed-up user's linked accounts")
    public void that_account_appears_in_the_new_users_linked_accounts() {
        int newUserId = authBackendSteps.getSignedUpUserId();
        List body = restTemplate.getForObject(
                environmentConfig.accountServiceUrl() + "/user_account/v1/fetch_all?user_ids=" + newUserId, List.class);
        List<Integer> ids = ((List<Map>) body).stream().map(a -> (Integer) a.get("user_account_id")).toList();
        assertThat(ids).contains(newUserAccountId);
    }

    @Then("the sample HDFC statement's transactions appear when fetching the demo user's transactions")
    public void the_statements_transactions_appear_when_fetching() {
        String today = java.time.LocalDate.now().toString();
        // The sample HDFC.xls statement's rows carry their own (historical)
        // dates, not "today" - fetch a wide range so whatever it parsed to
        // is definitely included, rather than guessing its exact date(s).
        Map body = restTemplate.getForObject(
                environmentConfig.transactionServiceUrl()
                        + "/transaction/v1/fetch_all?user_account_ids=" + HDFC_USER_ACCOUNT_ID
                        + "&start_date=2000-01-01&end_date=" + today,
                Map.class);
        List transactions = (List) body.get("transactions");
        assertThat(transactions).isNotEmpty();
    }
}
