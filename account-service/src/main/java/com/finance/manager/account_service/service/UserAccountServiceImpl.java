
package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dao.UserAccountDao;
import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import com.finance.manager.account_service.util.AccountGrouper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {

    private final UserAccountDao dao;

    @Override
    public List<UserAccount> getAllAccounts(List<Integer> userIds) {
        return dao.getAllAccounts(userIds);
    }

    @Override
    public List<GroupedUserAccount> getAllGroupedAccounts(List<Integer> userIds) {
        List<UserAccount> accounts = getAllAccounts(userIds);
        return AccountGrouper.groupUserAccounts(accounts);
    }
    
    @Override
    public int saveUserAccount(UserAccountSaveRequest request) {
        return dao.saveUserAccount(request);
    }

    @Override
    @Transactional
    public void deleteUserAccount(int userAccountId) {
        log.info("Processing deletion of user account ID: {} and all related data", userAccountId);
        dao.deleteTransactionCategories(userAccountId);
        dao.deleteTransactions(userAccountId);
        dao.deleteUserAccount(userAccountId);
    }

    @Override
    public void editUserAccountName(UserAccountEditRequest request) {
        dao.editUserAccountName(request);
    }
}
