package com.finance.manager.test_automation.steps.backend;

import com.finance.manager.test_automation.config.EnvironmentConfig;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Uses scripts/statements/HDFC.xls - a real sample statement file already in
 * the repo - matched against account_id=1 (hdfc)'s "xls" v1 account_statement
 * sample-data row (dbscripts/table/insert/account_statement.sql), which is
 * valid for any date from 2026-09-09 onward.
 */
public class StatementUploadBackendSteps {

    private static final int HDFC_ACCOUNT_ID = 1;
    private static final int HDFC_USER_ACCOUNT_ID = 1;
    private static final int DEMO_USER_ID = 1;

    private final EnvironmentConfig environmentConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    private ResponseEntity<List> uploadResponse;

    public StatementUploadBackendSteps(EnvironmentConfig environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    @When("I POST the sample HDFC statement to statement-loader")
    public void i_post_the_sample_hdfc_statement() {
        String repoRoot = System.getProperty("user.dir").replaceAll("/test-automation$", "");
        Path file = Path.of(repoRoot, "scripts", "statements", "HDFC.xls");
        String base64;
        try {
            base64 = Base64.getEncoder().encodeToString(Files.readAllBytes(file));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        Map<String, Object> request = Map.of(
                "account_id", HDFC_ACCOUNT_ID,
                "user_id", DEMO_USER_ID,
                "user_account_id", HDFC_USER_ACCOUNT_ID,
                "file", base64,
                "file_name", "HDFC.xls",
                "file_extension", "xls",
                "request_id", "test-upload-" + System.currentTimeMillis());

        uploadResponse = restTemplate.postForEntity(
                environmentConfig.statementLoaderUrl() + "/statement/upload/v1/",
                List.of(request), List.class);
    }

    @Then("the upload response has status {int} and reports success")
    public void the_upload_response_reports_success(int expectedStatus) {
        assertThat(uploadResponse.getStatusCode().value()).isEqualTo(expectedStatus);
        Map result = (Map) uploadResponse.getBody().get(0);
        assertThat(result.get("status")).isEqualTo(true);
    }
}
