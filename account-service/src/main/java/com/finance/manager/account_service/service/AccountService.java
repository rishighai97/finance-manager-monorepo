package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;

import java.util.List;

public interface AccountService {
    List<Account> getAllAccounts();
    List<GroupedAccount> getAllGroupedAccounts();
}