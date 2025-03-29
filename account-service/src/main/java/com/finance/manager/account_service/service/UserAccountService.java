
package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;

import java.util.List;

public interface UserAccountService {
    List<UserAccount> getAllAccounts(List<Integer> userIds);

    List<GroupedUserAccount> getAllGroupedAccounts(List<Integer> userIds);
    
    /**
     * Creates a new user account
     * 
     * @param request The user account creation request
     * @return The ID of the newly created user account
     */
    int saveUserAccount(UserAccountSaveRequest request);
}
