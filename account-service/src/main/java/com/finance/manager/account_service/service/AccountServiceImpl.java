package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dao.AccountDao;
import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import com.finance.manager.account_service.util.AccountGrouper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountDao dao;

    @Override
    public List<Account> getAllAccounts() {
        return dao.getAllAccounts();
    }

    @Override
    public List<GroupedAccount> getAllGroupedAccounts() {
        List<Account> accounts = getAllAccounts();
        return AccountGrouper.groupAccounts(accounts);
    }
}