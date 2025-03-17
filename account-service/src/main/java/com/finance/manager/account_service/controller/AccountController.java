package com.finance.manager.account_service.controller;

import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/account")
@CrossOrigin
@RequiredArgsConstructor
public class AccountController {

    private static final Logger logger = Logger.getLogger(AccountController.class.getName());

    private final AccountService service;


    @GetMapping("/v1/healthcheck")
    public String healthcheck() {
        return "Account API is up and running!";
    }

    @GetMapping("/v1/fetch_all")
    public List<UserAccount> fetchAllAccountsByUserIds(@RequestParam(value = "user_ids") List<Integer> userIds) {
        validateUserIds(userIds);
        logger.info("Received request to fetch accounts for user ids " + userIds);
        return service.getAllAccounts(userIds);
    }

    @GetMapping("/v1/fetch_all/grouped")
    public List<GroupedUserAccount> fetchAllGroupedAccountsByUserIds(@RequestParam(value = "user_ids") List<Integer> userIds) {
        validateUserIds(userIds);
        logger.info("Received request to fetch grouped accounts for user ids " + userIds);
        return service.getAllGroupedAccounts(userIds);
    }

    private void validateUserIds(List<Integer> userIdsList) {
        if (userIdsList == null || userIdsList.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please pass user_account_ids in request");
        }
    }
}