
package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record UserAccountEditRequest(
        @JsonProperty("user_account_id")
        int userAccountId,

        @JsonProperty("new_user_account_name")
        String newUserAccountName
) {

}
