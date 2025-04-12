//package com.finance.manager.api_gateway.config;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.cloud.gateway.route.RouteLocator;
//import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.HttpMethod;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.server.reactive.ServerHttpRequest;
//import org.springframework.http.server.reactive.ServerHttpResponse;
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.server.ServerWebExchange;
//import org.springframework.web.server.WebFilter;
//import org.springframework.web.server.WebFilterChain;
//import reactor.core.publisher.Mono;
//
//@Configuration
//public class GatewayConfig {
//
//    private final String accountServiceUri;
//    private final String transactionServiceUri;
//    private final String statementUploaderUri;
//
//    public GatewayConfig(
//            @Value("${account.service.uri:http://localhost:5003}")
//            String accountServiceUri,
//            @Value("${account.service.uri:http://localhost:5004}")
//            String transactionServiceUri,
//            @Value("${account.service.uri:http://localhost:5002}")
//            String statementUploaderUri) {
//        this.accountServiceUri = accountServiceUri;
//        this.transactionServiceUri = transactionServiceUri;
//        this.statementUploaderUri = statementUploaderUri;
//    }
//
//
//    @Bean
//    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
//        return builder.routes()
//                // Account Service Routes
//                .route("account_service", r -> r.path("/account/**", "/user_account/**")
//                        .uri(accountServiceUri))
//
//                // Transaction Service Routes
//                .route("transaction_service", r -> r.path("/transaction/**", "/category/**")
//                        .uri(transactionServiceUri))
//
//                // Statement Uploader Service Routes
//                .route("statement_uploader_service", r -> r.path("/statement/**")
//                        .uri(statementUploaderUri))
//                .build();
//    }
//
//    @Bean
//    public WebFilter customHeadersFilter() {
//        return (ServerWebExchange exchange, WebFilterChain chain) -> {
//            ServerHttpRequest request = exchange.getRequest();
//            ServerHttpResponse response = exchange.getResponse();
//
//            // Add headers that would normally be added by CORS filter
//            response.getHeaders().add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
//            response.getHeaders().add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, PUT, DELETE, OPTIONS");
//            response.getHeaders().add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type, Authorization");
//            response.getHeaders().add(HttpHeaders.ACCESS_CONTROL_MAX_AGE, "3600");
//
//            // Handle OPTIONS requests specifically (pre-flight requests)
//            if (request.getMethod() == HttpMethod.OPTIONS) {
//                response.setStatusCode(HttpStatus.OK);
//                return Mono.empty();
//            }
//
//            return chain.filter(exchange);
//        };
//    }
//}
