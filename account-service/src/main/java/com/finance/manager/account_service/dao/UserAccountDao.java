package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.UserAccount;

import java.util.List;

public interface UserAccountDao {
    List<UserAccount> getAllAccounts(List<Integer> userIds);
}
