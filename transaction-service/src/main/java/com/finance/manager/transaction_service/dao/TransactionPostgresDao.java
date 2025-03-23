package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.Transaction;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public class TransactionPostgresDao implements TransactionDao {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private static final Logger logger = LoggerFactory.getLogger(TransactionPostgresDao.class);

    @Autowired
    public TransactionPostgresDao(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Override
    public List<Transaction> fetchAll(List<Integer> userAccountIds, String startDate, String endDate) {
        logger.info("Fetching user transactions for user accounts {}, start date {}, end date {} from database",
                userAccountIds, startDate, endDate);

        String sql = """
        SELECT id,
            date,
            user_account_id,
            title,
            amount,
            debit_credit_indicator,
            closing_balance,
            category_id,
            units,
            price_per_unit
        FROM "transaction"
        WHERE user_account_id IN (:userAccountIds) AND date BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE) 
        ORDER BY date desc, user_account_id desc
        """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userAccountIds", userAccountIds)
                .addValue("startDate", startDate)
                .addValue("endDate", endDate);

        List<Transaction> transactions = namedParameterJdbcTemplate.query(sql, params, (rs, rowNum) -> {
            String id = rs.getString("id");
            String date = rs.getDate("date") != null ? rs.getDate("date").toString() : null;
            int userAccountId = rs.getInt("user_account_id");
            String title = rs.getString("title");
            BigDecimal amount = rs.getBigDecimal("amount");
            String debitCreditIndicator = rs.getString("debit_credit_indicator");
            BigDecimal closingBalance = rs.getBigDecimal("closing_balance");
            Integer categoryId = rs.getObject("category_id") != null ? rs.getInt("category_id") : null;
            Integer units = rs.getObject("units") != null ? rs.getInt("units") : null;
            BigDecimal pricePerUnit = rs.getBigDecimal("price_per_unit");

            if (date == null) {
                throw new RuntimeException("Invalid date " + rs.getObject("date") + " received for request");
            }

            return Transaction.builder()
                    .transactionId(id)
                    .date(date)
                    .userAccountId(userAccountId)
                    .title(title)
                    .debitOrCreditAmount(amount)
                    .isDebitOrCredit(debitCreditIndicator)
                    .closingBalance(closingBalance)
                    .categoryId(categoryId)
                    .units(units)
                    .pricePerUnit(pricePerUnit)
                    .build();
        });

        logger.info("Fetched {} user transactions for user accounts {}, start date {}, end date {} from database",
                transactions.size(), userAccountIds, startDate, endDate);

        return transactions;
    }
}
