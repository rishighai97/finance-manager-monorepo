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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class TransactionBackendSteps {

    private static final int HDFC_USER_ACCOUNT_ID = 1;
    private static final int SALARY_CATEGORY_ID = 1;

    private final EnvironmentConfig environmentConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    private String debitTransactionId;
    private String creditTransactionId;
    private Map<String, Object> fetchResult;

    public TransactionBackendSteps(EnvironmentConfig environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    private Map<String, Object> newTransaction(String id, String title, String indicator) {
        return Map.of(
                "transaction_id", id,
                "date", LocalDate.now().toString(),
                "user_account_id", HDFC_USER_ACCOUNT_ID,
                "title", title,
                "debit_or_credit_amount", 250,
                "is_debit_or_credit", indicator,
                "closing_balance", 5000);
    }

    @Given("the demo user has one fresh debit and one fresh credit transaction today")
    public void the_demo_user_has_fresh_transactions() {
        long ts = System.currentTimeMillis();
        debitTransactionId = "test-txn-dr-" + ts;
        creditTransactionId = "test-txn-cr-" + ts;
        List<Map<String, Object>> transactions = List.of(
                newTransaction(debitTransactionId, "Test debit transaction", "DR"),
                newTransaction(creditTransactionId, "Test credit transaction", "CR"));
        restTemplate.postForEntity(
                environmentConfig.transactionServiceUrl() + "/transaction/v1/save_all", transactions, Void.class);
    }

    private Map<String, Object> fetchTransactions(String extraQuery) {
        String today = LocalDate.now().toString();
        String url = UriComponentsBuilder
                .fromHttpUrl(environmentConfig.transactionServiceUrl() + "/transaction/v1/fetch_all")
                .queryParam("user_account_ids", HDFC_USER_ACCOUNT_ID)
                .queryParam("start_date", today)
                .queryParam("end_date", today)
                .toUriString() + (extraQuery == null ? "" : extraQuery);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        return response.getBody();
    }

    @When("I GET the demo user's transactions for today")
    public void i_get_the_demo_users_transactions_for_today() {
        fetchResult = fetchTransactions(null);
    }

    @Then("the fetch response includes both fresh transactions")
    public void the_fetch_response_includes_both_fresh_transactions() {
        List<String> ids = ((List<Map>) fetchResult.get("transactions")).stream()
                .map(t -> (String) t.get("transaction_id"))
                .toList();
        assertThat(ids).contains(debitTransactionId, creditTransactionId);
    }

    @Given("one of those transactions is mapped to the SALARY category")
    public void one_of_those_transactions_is_mapped_to_salary() {
        Map<String, Object> mapping = Map.of(
                "transaction_id", debitTransactionId,
                "user_category_id", SALARY_CATEGORY_ID,
                "action", "INSERT");
        restTemplate.exchange(
                environmentConfig.transactionServiceUrl() + "/category/v1/transaction_user_category/edit_all",
                HttpMethod.PUT, new HttpEntity<>(List.of(mapping)), Void.class);
    }

    @When("I GET the demo user's transactions filtered by the SALARY category")
    public void i_get_transactions_filtered_by_salary_category() {
        fetchResult = fetchTransactions("&category_ids=" + SALARY_CATEGORY_ID);
    }

    @Then("only the SALARY-mapped transaction is returned")
    public void only_the_salary_mapped_transaction_is_returned() {
        List<String> ids = ((List<Map>) fetchResult.get("transactions")).stream()
                .map(t -> (String) t.get("transaction_id"))
                .toList();
        assertThat(ids).contains(debitTransactionId);
        assertThat(ids).doesNotContain(creditTransactionId);
    }

    @When("I GET the demo user's transactions filtered to debit only")
    public void i_get_transactions_filtered_to_debit_only() {
        fetchResult = fetchTransactions("&debit_credit_indicator=DR");
    }

    @Then("only the debit transaction is returned")
    public void only_the_debit_transaction_is_returned() {
        List<String> ids = ((List<Map>) fetchResult.get("transactions")).stream()
                .map(t -> (String) t.get("transaction_id"))
                .toList();
        assertThat(ids).contains(debitTransactionId);
        assertThat(ids).doesNotContain(creditTransactionId);
    }

    public static final String DEBIT_TITLE = "Test debit transaction";
    public static final String CREDIT_TITLE = "Test credit transaction";
}
