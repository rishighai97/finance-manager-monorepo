package com.finance.manager.test_automation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * No standalone runtime role - this exists so Cucumber's Spring glue
 * (cucumber-spring) has a Spring Boot application context to load per test
 * run, giving step definition classes constructor-injected config beans
 * (see config.EnvironmentConfig) and Spring profile-based environment
 * selection (local/dev/qa/uat/prod), consistent with the rest of this repo.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class TestAutomationApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestAutomationApplication.class, args);
    }
}
