package com.finance.manager.account_service.controller;

import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import com.finance.manager.account_service.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/account")
@CrossOrigin
@RequiredArgsConstructor
public class AccountController {

    private static final Logger logger = Logger.getLogger(AccountController.class.getName());

    private final AccountService service;

    @GetMapping("/v1/healthcheck")
    public Map<String, String> healthcheck() {
        return Map.of("status", "OK");
    }

    @GetMapping("/v1/fetch_all")
    public List<Account> fetchAllAccounts() {
        logger.info("Received request to fetch all accounts");
        return service.getAllAccounts();
    }

    @GetMapping("/v1/fetch_all/grouped")
    public List<GroupedAccount> fetchAllGroupedAccounts() {
        logger.info("Received request to fetch all grouped accounts");
        return service.getAllGroupedAccounts();
    }
}