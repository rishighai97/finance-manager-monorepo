
package com.finance.manager.transaction_service.controller;

import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;
import com.finance.manager.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/transaction")
@CrossOrigin
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);


    @PostMapping("/v1/save_all")
    public void saveAll(@RequestBody List<Transaction> transactions) {
        transactionService.saveAll(transactions);
    }

    @GetMapping("/v1/healthcheck")
    public String healthcheck() {
        return "Transaction API is up and running!";
    }

    @GetMapping("/v1/fetch_all")
    public ResponseEntity<TransactionsDto> fetchAllTransactionsByUserIdsStartDateAndEndDate(
            @RequestParam("user_account_ids") List<String> userAccountIdsList,
            @RequestParam("start_date") String startDate,
            @RequestParam("end_date") String endDate,
            @RequestParam(value = "category_ids", required = false) List<String> categoryIdsList,
            @RequestParam(value = "debit_credit_indicator", required = false) String debitCreditIndicator
    ) {

        List<Integer> userAccountIds = validateAndGetUserAccountIds(userAccountIdsList);
        validateAndGetRequestDate(startDate);
        validateAndGetRequestDate(endDate);

        // Parse optional category IDs
        Set<Integer> categoryIds = null;
        if (categoryIdsList != null && !categoryIdsList.isEmpty()) {
            categoryIds = new HashSet<>();
            try {
                for (String categoryId : categoryIdsList) {
                    categoryIds.add(Integer.parseInt(categoryId));
                }
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(400),
                        "Invalid category_ids passed in request - " + categoryIdsList + ". Please pass valid integer ids");
            }
        }

        logger.info("Received request to fetch transactions for user ids {}, start date {}, end date {}, debit_credit_indicator = {} {}",
                userAccountIds, startDate, endDate, debitCreditIndicator,
                categoryIds != null ? ", filtered by categories: " + categoryIds : "");

        TransactionsDto transactions = transactionService.getUserTransactions(userAccountIds, startDate, endDate, categoryIds, debitCreditIndicator);
        return ResponseEntity.ok(transactions);
    }

    private List<Integer> validateAndGetUserAccountIds(List<String> userAccountIdsList) {
        if (userAccountIdsList == null || userAccountIdsList.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please pass valid list of user_account_ids in request");
        }

        try {
            List<Integer> userAccountIds = userAccountIdsList.stream()
                    .map(Integer::parseInt)
                    .toList();

            if (userAccountIds.isEmpty()) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please pass valid list of user_account_ids in request");
            }

            return userAccountIds;
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400),
                    "Invalid user_account_ids passed in request - " + userAccountIdsList + ". Please pass valid integer ids");
        }
    }

    private void validateAndGetRequestDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please pass valid date in request");
        }

        try {
            // Parse the date to validate format
            LocalDate.parse(dateStr, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400),
                    "Invalid date passed in request - " + dateStr + ". Valid date format - yyyy-MM-dd");
        }
    }
}

