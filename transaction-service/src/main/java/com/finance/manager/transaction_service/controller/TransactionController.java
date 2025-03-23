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
import java.util.List;

@RestController
@RequestMapping("/transaction")
@CrossOrigin
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    @GetMapping("/v1/healthcheck")
    public String healthcheck() {
        return "Transaction API is up and running!";
    }

    @GetMapping("/v1/fetch_all")
    public ResponseEntity<TransactionsDto> fetchAllTransactionsByUserIdsStartDateAndEndDate(
            @RequestParam("user_account_ids") List<String> userAccountIdsList,
            @RequestParam("start_date") String startDate,
            @RequestParam("end_date") String endDate) {

        List<Integer> userAccountIds = validateAndGetUserAccountIds(userAccountIdsList);
        validateAndGetRequestDate(startDate);
        validateAndGetRequestDate(endDate);

        logger.info("Received request to fetch transactions for user ids {}, start date {} and end date {}",
                userAccountIds, startDate, endDate);

        TransactionsDto transactions = transactionService.getUserTransactions(userAccountIds, startDate, endDate);
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
