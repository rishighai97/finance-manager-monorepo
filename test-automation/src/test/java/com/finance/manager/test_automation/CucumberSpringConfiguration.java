package com.finance.manager.test_automation;

import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Wires a Spring Boot context into every Cucumber scenario (cucumber-spring),
 * so step definition classes can @Autowired/constructor-inject config beans
 * like EnvironmentConfig. WebEnvironment.NONE - this app under test is
 * external (see EnvironmentConfig's javadoc); this context exists purely to
 * host configuration, not to serve anything itself.
 */
@CucumberContextConfiguration
@SpringBootTest(classes = TestAutomationApplication.class, webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class CucumberSpringConfiguration {
}
