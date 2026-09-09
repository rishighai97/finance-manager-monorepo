package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sample-data baseline: user_id=1 ("Rishi Ghai") already has 5 sample
 * categories (SALARY/FOOD/LUNCH/DINNER/SNACKS) - all create/edit/delete here
 * use freshly-generated titles so pre-existing sample rows are never touched.
 */
public class CategoryBackendSteps {

    private static final int DEMO_USER_ID = 1;
    private static final int HDFC_USER_ACCOUNT_ID = 1;

    private final EnvironmentConfig environmentConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    private ResponseEntity<Void> voidResponse;
    private ResponseEntity<List> listResponse;
    private List<String> createdTitles;
    private List<Integer> createdCategoryIds;
    private String createdTransactionId;

    public CategoryBackendSteps(EnvironmentConfig environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    private String transactionServiceUrl() {
        return environmentConfig.transactionServiceUrl();
    }

    @When("I POST to bulk-create {int} new categories")
    public void i_post_to_bulk_create_new_categories(int count) {
        createdTitles = new ArrayList<>();
        List<Map<String, Object>> body = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String title = "TEST_CAT_" + System.currentTimeMillis() + "_" + i;
            createdTitles.add(title);
            body.add(Map.of("user_id", DEMO_USER_ID, "category_title", title));
        }
        voidResponse = restTemplate.postForEntity(
                transactionServiceUrl() + "/category/v1/save_all", body, Void.class);
    }

    @Then("the category save response has status {int}")
    public void the_category_save_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }

    @Then("all {int} new categories are visible when fetching the demo user's categories")
    public void all_new_categories_are_visible(int count) {
        fetchDemoUserCategories();
        List<String> fetchedTitles = ((List<Map>) listResponse.getBody()).stream()
                .map(c -> (String) c.get("category_title"))
                .toList();
        assertThat(fetchedTitles).containsAll(createdTitles);
        assertThat(createdTitles).hasSize(count);
    }

    private void fetchDemoUserCategories() {
        listResponse = restTemplate.getForEntity(
                transactionServiceUrl() + "/category/v1/fetch_all?user_ids=" + DEMO_USER_ID, List.class);
    }

    private List<Integer> fetchCategoryIdsByTitles(List<String> titles) {
        fetchDemoUserCategories();
        return ((List<Map>) listResponse.getBody()).stream()
                .filter(c -> titles.contains(c.get("category_title")))
                .map(c -> (Integer) c.get("id"))
                .toList();
    }

    @Given("the demo user has {int} freshly-created categories")
    public void the_demo_user_has_freshly_created_categories(int count) {
        i_post_to_bulk_create_new_categories(count);
        createdCategoryIds = fetchCategoryIdsByTitles(createdTitles);
        assertThat(createdCategoryIds).hasSize(count);
    }

    @When("I PUT updated titles for those categories")
    public void i_put_updated_titles_for_those_categories() {
        List<Map<String, Object>> body = new ArrayList<>();
        List<String> updatedTitles = new ArrayList<>();
        for (int id : createdCategoryIds) {
            String updated = "TEST_CAT_RENAMED_" + System.currentTimeMillis() + "_" + id;
            updatedTitles.add(updated);
            body.add(Map.of("id", id, "user_id", DEMO_USER_ID, "category_title", updated));
        }
        createdTitles = updatedTitles;
        voidResponse = restTemplate.exchange(
                transactionServiceUrl() + "/category/v1/edit_all",
                HttpMethod.PUT, new HttpEntity<>(body), Void.class);
    }

    @Then("the category edit response has status {int}")
    public void the_category_edit_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }

    @Then("the updated titles are visible when fetching the demo user's categories")
    public void the_updated_titles_are_visible() {
        fetchDemoUserCategories();
        List<String> fetchedTitles = ((List<Map>) listResponse.getBody()).stream()
                .map(c -> (String) c.get("category_title"))
                .toList();
        assertThat(fetchedTitles).containsAll(createdTitles);
    }

    @When("I DELETE those categories in bulk")
    public void i_delete_those_categories_in_bulk() {
        List<Map<String, Object>> body = createdCategoryIds.stream()
                .map(id -> (Map<String, Object>) Map.<String, Object>of("id", id))
                .toList();
        voidResponse = restTemplate.exchange(
                transactionServiceUrl() + "/category/v1/delete_all",
                HttpMethod.DELETE, new HttpEntity<>(body), Void.class);
    }

    @Then("the category delete response has status {int}")
    public void the_category_delete_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }

    @Then("those categories no longer appear when fetching the demo user's categories")
    public void those_categories_no_longer_appear() {
        fetchDemoUserCategories();
        List<Integer> fetchedIds = ((List<Map>) listResponse.getBody()).stream()
                .map(c -> (Integer) c.get("id"))
                .toList();
        assertThat(fetchedIds).doesNotContainAnyElementsOf(createdCategoryIds);
    }

    private String createdTransactionTitle;

    @Given("a fresh transaction exists for the demo user's hdfc account")
    public void a_fresh_transaction_exists() {
        long ts = System.currentTimeMillis();
        createdTransactionId = "test-txn-" + ts;
        // Unique title per run, not a fixed literal - repeated suite runs
        // otherwise accumulate many rows sharing one title (no cleanup
        // between runs, see README Gotchas), and a UI test clicking "the"
        // matching row can hit an old, already-5-categories-mapped one
        // (add-category button hides past that limit) instead of this one.
        createdTransactionTitle = "Test transaction for category mapping " + ts;
        Map<String, Object> transaction = Map.of(
                "transaction_id", createdTransactionId,
                // today's date - finance-manager-ui's transaction list defaults
                // to the current financial year, so "today" is always within
                // the default visible range for the UI variant of this test.
                "date", java.time.LocalDate.now().toString(),
                "user_account_id", HDFC_USER_ACCOUNT_ID,
                "title", createdTransactionTitle,
                "debit_or_credit_amount", 100,
                "is_debit_or_credit", "DR",
                // transaction-service's fetch_all NPEs on a null closing_balance
                // (TransactionServiceImpl.calculateClosingBalance) - not reachable
                // via the real product flow since statement-loader always
                // populates it from the parsed statement, but this API-created
                // fixture needs to supply one too to match that same shape.
                "closing_balance", 1000);
        restTemplate.postForEntity(
                transactionServiceUrl() + "/transaction/v1/save_all", List.of(transaction), Void.class);
    }

    public String getCreatedTransactionTitle() {
        return createdTransactionTitle;
    }

    public String getCreatedTransactionId() {
        return createdTransactionId;
    }

    @When("I map that transaction to the SALARY category")
    public void i_map_that_transaction_to_the_salary_category() {
        int salaryCategoryId = 1; // sample data: id=1 is SALARY for user_id=1 (dbscripts/table/insert/user_category.sql)
        Map<String, Object> mapping = Map.of(
                "transaction_id", createdTransactionId,
                "user_category_id", salaryCategoryId,
                "action", "INSERT");
        voidResponse = restTemplate.exchange(
                transactionServiceUrl() + "/category/v1/transaction_user_category/edit_all",
                HttpMethod.PUT, new HttpEntity<>(List.of(mapping)), Void.class);
    }

    @Then("the mapping response has status {int}")
    public void the_mapping_response_has_status(int expectedStatus) {
        assertThat(voidResponse.getStatusCode().value()).isEqualTo(expectedStatus);
    }
}
