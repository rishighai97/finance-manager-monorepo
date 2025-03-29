
package com.finance.manager.account_service.controller;

import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import com.finance.manager.account_service.service.UserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.logging.Logger;

@RestController
@RequestMapping("/user_account")
@CrossOrigin
@RequiredArgsConstructor
public class UserAccountController {

    private static final Logger logger = Logger.getLogger(UserAccountController.class.getName());

    private final UserAccountService service;


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
    
    @PostMapping("/v1/save")
    public ResponseEntity<Integer> saveUserAccount(@RequestBody UserAccountSaveRequest request) {
        validateUserAccountSaveRequest(request);
        logger.info("Received request to create user account for user ID: " + request.userId());
        int userAccountId = service.saveUserAccount(request);
        return ResponseEntity.ok(userAccountId);
    }

    @DeleteMapping("/v1/delete")
    public ResponseEntity<Void> deleteUserAccount(@RequestParam(value = "user_account_id") int userAccountId) {
        validateUserAccountId(userAccountId);
        logger.info("Received request to delete user account with ID: " + userAccountId);
        service.deleteUserAccount(userAccountId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/v1/edit")
    public ResponseEntity<Void> editUserAccountName(@RequestBody UserAccountEditRequest request) {
        validateUserAccountEditRequest(request);
        logger.info("Received request to edit user account name for account ID: " + request.userAccountId());
        service.editUserAccountName(request);
        return ResponseEntity.ok().build();
    }

    private void validateUserIds(List<Integer> userIdsList) {
        if (userIdsList == null || userIdsList.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please pass user_account_ids in request");
        }
    }
    
    private void validateUserAccountSaveRequest(UserAccountSaveRequest request) {
        if (request.userId() <= 0) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "User ID must be a positive integer");
        }
        
        if (request.accountId() <= 0) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Account ID must be a positive integer");
        }
        
        if (request.userAccountName() == null || request.userAccountName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Account userAccountName is required");
        }
    }

    private void validateUserAccountId(int userAccountId) {
        if (userAccountId <= 0) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "User account ID must be a positive integer");
        }
    }

    private void validateUserAccountEditRequest(UserAccountEditRequest request) {
        if (request.userAccountId() <= 0) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "User account ID must be a positive integer");
        }
        
        if (request.newUserAccountName() == null || request.newUserAccountName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "New account name is required");
        }
    }
}
