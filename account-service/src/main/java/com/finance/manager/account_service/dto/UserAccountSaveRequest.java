
package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record UserAccountSaveRequest(
        @JsonProperty("user_id")
        int userId,

        @JsonProperty("account_id")
        int accountId,

        @JsonProperty("user_account_name")
        String userAccountName
) {

}
