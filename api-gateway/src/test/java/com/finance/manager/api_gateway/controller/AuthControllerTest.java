package com.finance.manager.api_gateway.controller;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;
import com.finance.manager.api_gateway.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController controller;

    @Nested
    @DisplayName("healthCheck")
    class HealthCheck {

        @Test
        @DisplayName("returns status OK without touching the service")
        void returnsStatusOk() {
            assertThat(controller.healthCheck()).isEqualTo(Map.of("status", "OK"));
        }
    }

    @Nested
    @DisplayName("signup")
    class Signup {

        @Test
        @DisplayName("returns 200 with the new user's details on success")
        void returnsUserDetailsOnSuccess() {
            UserSignupRequest request = UserSignupRequest.builder().username("newuser").password("secret").build();
            UserDetails created = UserDetails.builder().id(7).username("newuser").build();
            when(userService.createUser(request)).thenReturn(created);

            ResponseEntity<?> response = controller.signup(request);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(created);
        }

        @Test
        @DisplayName("propagates the service's HTTP status and reason when signup fails")
        void propagatesServiceFailureStatus() {
            UserSignupRequest request = UserSignupRequest.builder().username("existing").password("secret").build();
            when(userService.createUser(request))
                    .thenThrow(new HttpClientErrorException(HttpStatusCode.valueOf(409), "Username already taken"));

            ResponseEntity<?> response = controller.signup(request);

            assertThat(response.getStatusCode().value()).isEqualTo(409);
        }
    }

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("returns 200 with the auth response on success")
        void returnsAuthResponseOnSuccess() {
            UserLoginRequest request = UserLoginRequest.builder().username("existinguser").password("correct").build();
            AuthResponse authResponse = AuthResponse.builder().accessToken("token-123").userId(3).username("existinguser").build();
            when(userService.authenticateUser(request)).thenReturn(authResponse);

            ResponseEntity<?> response = controller.login(request);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(authResponse);
        }

        @Test
        @DisplayName("propagates the service's HTTP status when login fails")
        void propagatesServiceFailureStatus() {
            UserLoginRequest request = UserLoginRequest.builder().username("existinguser").password("wrong").build();
            when(userService.authenticateUser(request))
                    .thenThrow(new HttpClientErrorException(HttpStatusCode.valueOf(401), "Incorrect password"));

            ResponseEntity<?> response = controller.login(request);

            assertThat(response.getStatusCode().value()).isEqualTo(401);
        }
    }

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("delegates to the service with the raw Authorization header and returns 200")
        void delegatesToService() {
            ResponseEntity<Void> response = controller.logout("Bearer token-123");

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(userService).logout("Bearer token-123");
        }
    }
}
