
package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
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

    /**
     * Deletes a user account by its ID
     * 
     * @param userAccountId The ID of the user account to delete
     */
    void deleteUserAccount(int userAccountId);

    /**
     * Updates the name of a user account
     * 
     * @param request The request containing the user account ID and the new name
     */
    void editUserAccountName(UserAccountEditRequest request);
}
