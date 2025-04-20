plugins {
	java
	war
	id("org.springframework.boot") version "3.5.0-SNAPSHOT"
	id("io.spring.dependency-management") version "1.1.7"
//	kotlin("jvm")
}

group = "com.finance.manager"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
	maven { url = uri("https://repo.spring.io/milestone") }
	maven { url = uri("https://repo.spring.io/snapshot") }
}

//extra["springCloudVersion"] = "2025.0.0-M3"

dependencies {
	// Spring Boot Core
	implementation("org.springframework.boot:spring-boot-starter-web")
//	implementation("org.springframework.boot:spring-boot-starter-validation")
//	implementation("org.springframework.boot:spring-boot-starter-actuator")

	// Spring Security
//	implementation("org.springframework.boot:spring-boot-starter-security")

	// Database
	implementation("org.springframework.boot:spring-boot-starter-jdbc")
	implementation("org.postgresql:postgresql")

	// Gateway
//	implementation("org.springframework.cloud:spring-cloud-starter-gateway")

	// JWT/Auth
//	implementation("io.jsonwebtoken:jjwt-api:0.11.5")
//	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
//	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

	// Lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")

	// Keycloak (if you're keeping Keycloak integration)
//	implementation("org.keycloak:keycloak-spring-boot-starter:23.0.4")
//	implementation("org.keycloak:keycloak-admin-client:23.0.4")

	// Password hashing
	implementation("org.springframework.security:spring-security-crypto")

	// Test dependencies
	testImplementation("org.springframework.boot:spring-boot-starter-test")
//	testImplementation("org.springframework.security:spring-security-test")
//	implementation(kotlin("stdlib"))
}

//dependencyManagement {
//	imports {
//		mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")
//	}
//}

tasks.withType<Test> {
	useJUnitPlatform()
}
