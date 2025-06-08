
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
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

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
        // Call the overloaded method with null categoryIds
        return fetchAll(userAccountIds, startDate, endDate, null);
    }

    @Override
    public List<Transaction> fetchAll(List<Integer> userAccountIds, String startDate, String endDate, Set<Integer> categoryIds) {
        logger.info("Fetching user transactions for user accounts {}, start date {}, end date {}{}",
                userAccountIds, startDate, endDate, categoryIds != null ? ", filtered by categories: " + categoryIds : "");

        StringBuilder sqlBuilder = new StringBuilder("""
                SELECT t.id,
                    t.date,
                    t.user_account_id,
                    t.title,
                    t.amount,
                    t.debit_credit_indicator,
                    t.closing_balance,
                    t.category_id,
                    t.units,
                    t.price_per_unit,
                    STRING_AGG(CAST(tuc.user_category_id AS TEXT), ',') AS user_category_ids
                FROM "transaction" t
                LEFT JOIN transaction_user_category tuc ON t.id = tuc.transaction_id
                WHERE t.user_account_id IN (:userAccountIds) AND t.date BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
                """);

        // Add category filter if categoryIds is provided
        if (categoryIds != null && !categoryIds.isEmpty()) {
            sqlBuilder.append("""
                    AND EXISTS (
                        SELECT 1 FROM transaction_user_category tuc2
                        WHERE tuc2.transaction_id = t.id AND tuc2.user_category_id IN (:categoryIds)
                    )
                    """);
        }

        sqlBuilder.append("""
                GROUP BY t.id, t.date, t.user_account_id, t.title, t.amount, t.debit_credit_indicator, t.closing_balance, t.category_id, t.units, t.price_per_unit
                ORDER BY t.date desc, t.user_account_id desc
                """);

        String sql = sqlBuilder.toString();

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userAccountIds", userAccountIds)
                .addValue("startDate", startDate)
                .addValue("endDate", endDate);

        // Only add categoryIds parameter if it's not null and not empty
        if (categoryIds != null && !categoryIds.isEmpty()) {
            params.addValue("categoryIds", categoryIds);
        }

        List<Transaction> transactions = namedParameterJdbcTemplate.query(sql, params, (rs, rowNum) -> {
            try {
                String id = rs.getString("id");
                LocalDate date = rs.getDate("date") != null ? LocalDate.parse(new SimpleDateFormat("yyyy-MM-dd").format(rs.getDate("date"))) : null;
                int userAccountId = rs.getInt("user_account_id");
                String title = rs.getString("title");
                BigDecimal amount = rs.getBigDecimal("amount");
                String debitCreditIndicator = rs.getString("debit_credit_indicator");
                BigDecimal closingBalance = rs.getBigDecimal("closing_balance");
                Integer categoryId = rs.getObject("category_id") != null ? rs.getInt("category_id") : null;
                Integer units = rs.getObject("units") != null ? rs.getInt("units") : null;
                BigDecimal pricePerUnit = rs.getBigDecimal("price_per_unit");

                // Parse the comma-separated category IDs into a Set<Integer>
                Set<Integer> userCategoryIds = parseCategoryIds(rs.getString("user_category_ids"));

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
                        .userCategoryIds(userCategoryIds)
                        .build();
            } catch (Exception e) {
                throw new RuntimeException("Exception occurred while converting transaction data", e);
            }
        });

        logger.info("Fetched {} user transactions for user accounts {}, start date {}, end date {}{}",
                transactions.size(), userAccountIds, startDate, endDate,
                categoryIds != null ? ", filtered by categories: " + categoryIds : "");

        return transactions;
    }

    @Override
    public void saveAll(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return;
        }

        logger.info("Saving {} transaction records", transactions.size());

        String sql = """
                    INSERT INTO transaction (id, "date", user_account_id, title, amount, debit_credit_indicator, closing_balance, category_id)
                    VALUES (:id, :date, :user_account_id, :title, :amount, :debit_credit_indicator, :closing_balance, :category_id)
                    ON CONFLICT (id) DO UPDATE SET
                        "date" = EXCLUDED."date",
                        user_account_id = EXCLUDED.user_account_id,
                        title = EXCLUDED.title,
                        amount = EXCLUDED.amount,
                        debit_credit_indicator = EXCLUDED.debit_credit_indicator,
                        closing_balance = EXCLUDED.closing_balance,
                        category_id = EXCLUDED.category_id;
                """;

        List<MapSqlParameterSource> batchParams = new ArrayList<>();

        for (Transaction t : transactions) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("id", t.transactionId())
                    .addValue("date", t.date())
                    .addValue("user_account_id", t.userAccountId())
                    .addValue("title", t.title())
                    .addValue("amount", t.debitOrCreditAmount())
                    .addValue("debit_credit_indicator", t.isDebitOrCredit())
                    .addValue("closing_balance", t.closingBalance())
                    .addValue("category_id", t.categoryId());

            batchParams.add(params);
        }

        int[] result = namedParameterJdbcTemplate.batchUpdate(sql, batchParams.toArray(new MapSqlParameterSource[0]));
        logger.info("Saved {} transaction records successfully", result.length);
    }


    /**
     * Parses a comma-separated string of category IDs into a Set of Integers
     */
    private Set<Integer> parseCategoryIds(String categoryIdsStr) {
        if (categoryIdsStr == null || categoryIdsStr.isEmpty()) {
            return Collections.emptySet();
        }

        try {
            return Arrays.stream(categoryIdsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());
        } catch (NumberFormatException e) {
            logger.error("Error parsing category IDs: {}", categoryIdsStr, e);
            return Collections.emptySet();
        }
    }
}