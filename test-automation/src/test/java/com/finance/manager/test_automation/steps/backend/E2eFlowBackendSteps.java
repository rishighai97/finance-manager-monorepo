package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

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

    private final EnvironmentConfig environmentConfig;
    private final AuthBackendSteps authBackendSteps;
    private final RestTemplate restTemplate = new RestTemplate();

    private int newUserAccountId;
    private String newAccountName;

    // Statement-upload-lifecycle scenario state (see JIRA_8's e2e_flow feature)
    private int lifecycleUserAccountId;
    private String lifecycleStartDate;
    private String lifecycleEndDate;
    private List<Map> uploadedTransactions;
    private String mappedTransactionId;
    private String mappedTransactionIndicator;
    private int freshCategoryId;

    public E2eFlowBackendSteps(EnvironmentConfig environmentConfig, AuthBackendSteps authBackendSteps) {
        this.environmentConfig = environmentConfig;
        this.authBackendSteps = authBackendSteps;
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

    @Then("{int} of the uploaded transactions are fetchable for user_account {int} between {string} and {string}")
    public void n_of_the_uploaded_transactions_are_fetchable(int expectedCount, int userAccountId,
                                                               String startDate, String endDate) {
        lifecycleUserAccountId = userAccountId;
        lifecycleStartDate = startDate;
        lifecycleEndDate = endDate;
        uploadedTransactions = fetchTransactions(userAccountId, startDate, endDate, null);
        assertThat(uploadedTransactions).hasSize(expectedCount);
    }

    @When("I map one of the uploaded transactions to a fresh category")
    public void i_map_one_of_the_uploaded_transactions_to_a_fresh_category() {
        Map transaction = uploadedTransactions.get(0);
        mappedTransactionId = (String) transaction.get("transaction_id");
        mappedTransactionIndicator = (String) transaction.get("is_debit_or_credit");

        String categoryTitle = "E2E_STATEMENT_CAT_" + System.currentTimeMillis();
        Map<String, Object> categoryRequest = Map.of("user_id", 1, "category_title", categoryTitle);
        restTemplate.postForEntity(
                environmentConfig.transactionServiceUrl() + "/category/v1/save_all",
                List.of(categoryRequest), Void.class);

        List categories = restTemplate.getForObject(
                environmentConfig.transactionServiceUrl() + "/category/v1/fetch_all?user_ids=1", List.class);
        freshCategoryId = (int) ((List<Map>) categories).stream()
                .filter(c -> categoryTitle.equals(c.get("category_title")))
                .findFirst().orElseThrow().get("id");

        Map<String, Object> mapping = Map.of(
                "transaction_id", mappedTransactionId,
                "user_category_id", freshCategoryId,
                "action", "INSERT");
        restTemplate.exchange(
                environmentConfig.transactionServiceUrl() + "/category/v1/transaction_user_category/edit_all",
                HttpMethod.PUT, new HttpEntity<>(List.of(mapping)), Void.class);
    }

    @Then("filtering user_account {int}'s transactions by that category returns only the mapped transaction")
    public void filtering_by_that_category_returns_only_the_mapped_transaction(int userAccountId) {
        List<Map> filtered = fetchTransactions(userAccountId, lifecycleStartDate, lifecycleEndDate,
                "&category_ids=" + freshCategoryId);
        List<String> ids = filtered.stream().map(t -> (String) t.get("transaction_id")).toList();
        assertThat(ids).containsExactly(mappedTransactionId);
    }

    private List<Map> filteredByIndicator;

    @When("I filter user_account {int}'s transactions by the mapped transaction's debit\\/credit indicator")
    public void i_filter_by_the_mapped_transactions_indicator(int userAccountId) {
        filteredByIndicator = fetchTransactions(userAccountId, lifecycleStartDate, lifecycleEndDate,
                "&debit_credit_indicator=" + mappedTransactionIndicator);
    }

    @Then("the filtered result includes the mapped transaction")
    public void the_filtered_result_includes_the_mapped_transaction() {
        List<String> ids = filteredByIndicator.stream().map(t -> (String) t.get("transaction_id")).toList();
        assertThat(ids).contains(mappedTransactionId);
    }

    private List<Map> fetchTransactions(int userAccountId, String startDate, String endDate, String extraQuery) {
        String url = UriComponentsBuilder
                .fromHttpUrl(environmentConfig.transactionServiceUrl() + "/transaction/v1/fetch_all")
                .queryParam("user_account_ids", userAccountId)
                .queryParam("start_date", startDate)
                .queryParam("end_date", endDate)
                .toUriString() + (extraQuery == null ? "" : extraQuery);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        return (List<Map>) response.getBody().get("transactions");
    }
}
