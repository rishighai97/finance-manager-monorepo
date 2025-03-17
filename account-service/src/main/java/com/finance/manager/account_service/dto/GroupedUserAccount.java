package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Builder
public record GroupedUserAccount(
        @JsonProperty("level_1_title")
        String level1Title,

        @JsonProperty("level_1_amount")
        BigDecimal level1Amount,

        @JsonProperty("level_2_title")
        String level2Title,

        @JsonProperty("level_2_amount")
        BigDecimal level2Amount,

        @JsonProperty("date")
        String date,

        @JsonProperty("user_accounts")
        List<UserAccount> userAccounts
) {
        @Override
        public List<UserAccount> userAccounts() {
                return Collections.unmodifiableList(userAccounts);
        }

        public static class GroupedUserAccountBuilder {
                public GroupedUserAccount.GroupedUserAccountBuilder userAccounts(List<UserAccount> userAccounts) {
                        this.userAccounts = Collections.unmodifiableList(userAccounts);
                        return this;
                }
        }
}
