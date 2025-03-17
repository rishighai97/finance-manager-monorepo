package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;

import java.util.List;

public interface AccountService {
    List<UserAccount> getAllAccounts(List<Integer> userIds);
    List<GroupedUserAccount> getAllGroupedAccounts(List<Integer> userIds);
}
