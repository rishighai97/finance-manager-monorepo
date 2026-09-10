package com.finance.manager.api_gateway.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthenticationExceptionTest {

    @Nested
    @DisplayName("construction")
    class Construction {

        @Test
        @DisplayName("carries the given message")
        void carriesMessage() {
            AuthenticationException exception = new AuthenticationException("bad credentials");

            assertThat(exception.getMessage()).isEqualTo("bad credentials");
            assertThat(exception.getCause()).isNull();
        }

        @Test
        @DisplayName("carries the given message and cause")
        void carriesMessageAndCause() {
            RuntimeException cause = new RuntimeException("root cause");

            AuthenticationException exception = new AuthenticationException("bad credentials", cause);

            assertThat(exception.getMessage()).isEqualTo("bad credentials");
            assertThat(exception.getCause()).isSameAs(cause);
        }
    }
}
