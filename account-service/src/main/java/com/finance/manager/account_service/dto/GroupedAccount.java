package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Builder
public record GroupedAccount(
        @JsonProperty("level_1_title")
        String level1Title,

        @JsonProperty("level_2_title")
        String level2Title,

        @JsonProperty("accounts")
        List<Account> accounts
) {
        @Override
        public List<Account> accounts() {
                return Collections.unmodifiableList(accounts);
        }

        public static class GroupedAccountBuilder {
                public GroupedAccount.GroupedAccountBuilder accounts(List<Account> accounts) {
                        this.accounts = Collections.unmodifiableList(accounts);
                        return this;
                }
        }
}