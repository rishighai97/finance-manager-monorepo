package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.Account;

import java.util.List;

public interface AccountDao {
    List<Account> getAllAccounts();
}