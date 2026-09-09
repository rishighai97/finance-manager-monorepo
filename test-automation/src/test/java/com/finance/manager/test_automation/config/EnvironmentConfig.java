package com.finance.manager.test_automation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Base URLs for the app under test, one set per Spring profile
 * (application-{local,dev,qa,uat,prod}.properties). Selected via
 * spring.profiles.active - defaults to "local" (see build.gradle's `test`
 * task and this repo's other services' local/prod profile convention).
 *
 * All tests are black-box, backend-only: this project never starts the
 * services itself - run the local-run skill (or point at a real dev/qa/uat/
 * prod deployment) first, then point the active profile at it.
 */
@ConfigurationProperties(prefix = "test-automation")
public record EnvironmentConfig(
        String accountServiceUrl,
        String apiGatewayUrl,
        String transactionServiceUrl,
        String statementLoaderUrl) {
}
