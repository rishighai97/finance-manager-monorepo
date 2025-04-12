package com.finance.manager.api_gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
public class GatewayConfig {

    private final String accountServiceUri;
    private final String transactionServiceUri;
    private final String statementUploaderUri;

    public GatewayConfig(
            @Value("${account.service.uri:http://localhost:5003}")
            String accountServiceUri,
            @Value("${account.service.uri:http://localhost:5004}")
            String transactionServiceUri,
            @Value("${account.service.uri:http://localhost:5002}")
            String statementUploaderUri) {
        this.accountServiceUri = accountServiceUri;
        this.transactionServiceUri = transactionServiceUri;
        this.statementUploaderUri = statementUploaderUri;
    }


    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Account Service Routes
                .route("account_service", r -> r.path("/account/**", "/user_account/**")
                        .uri(accountServiceUri))

                // Transaction Service Routes
                .route("transaction_service", r -> r.path("/transaction/**", "/category/**")
                        .uri(transactionServiceUri))

                // Statement Uploader Service Routes
                .route("statement_uploader_service", r -> r.path("/statement/**")
                        .uri(statementUploaderUri))
                .build();
    }
}
