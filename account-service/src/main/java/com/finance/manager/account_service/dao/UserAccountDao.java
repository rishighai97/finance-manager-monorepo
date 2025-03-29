
package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;

import java.util.List;

public interface UserAccountDao {
    List<UserAccount> getAllAccounts(List<Integer> userIds);
    
    /**
     * Creates a new user account entry
     * 
     * @param request The user account creation request
     * @return The ID of the newly created user account
     */
    int saveUserAccount(UserAccountSaveRequest request);
}
