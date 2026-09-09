package com.finance.manager.test_automation;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

/**
 * Entry point Gradle's Test task actually finds: Gradle's own test-class
 * scanner works off compiled *Test class files, not classpath resources, so
 * relying solely on junit-platform.properties for cucumber.features discovery
 * isn't reliable here - this explicit @Suite class is the well-documented,
 * always-works way to wire Gradle -> JUnit Platform -> Cucumber's engine.
 *
 * Tag filtering (see build.gradle's `test` task) is passed via the
 * cucumber.filter.tags system property, which cucumber-junit-platform-engine
 * reads on its own - no ConfigurationParameter needed for it here.
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.finance.manager.test_automation")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value = "pretty, summary, html:build/reports/cucumber/report.html")
public class RunCucumberTest {
}
