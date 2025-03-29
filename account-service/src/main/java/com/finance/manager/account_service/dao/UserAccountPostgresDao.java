
package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Repository
public class UserAccountPostgresDao implements UserAccountDao {

    private static final Logger logger = LoggerFactory.getLogger(UserAccountPostgresDao.class);

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    public UserAccountPostgresDao(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Override
    public List<UserAccount> getAllAccounts(List<Integer> userIds) {
        logger.info("Getting user accounts for user_ids: {} from postgres", userIds);

        String sql = """
                select  user_account_id,
                        account_id,
                        user_id,
                        user_account_name,
                        account_type_id,
                        icon,
                        account_name,
                        account_type_1,
                        account_type_2,
                        account_type_3,
                        closing_balance,
                        closing_balance_date,
                        statement_file_extensions
                from
                    (
                    select
                        ua.id as user_account_id,
                        ua.account_id as account_id,
                        ua.user_id as user_id,
                        ua.user_account_name as user_account_name,
                        type_id as account_type_id,
                        ai.icon as icon,
                        a.name as account_name,
                        type_1 as account_type_1,
                        type_2 as account_type_2,
                        type_3 as account_type_3,
                        t.closing_balance as closing_balance,
                        t.date as closing_balance_date,
                        string_agg(DISTINCT as_ext.extension, ',') as statement_file_extensions,
                        row_number() over(partition by t.user_account_id order by date desc) as user_account_id_rank,
                        (case when t.user_account_id is not null then true else false end) as has_transactions
                    from
                        user_account ua
                    join account a on
                        ua.account_id = a.id
                    join account_type at2 on
                        at2.id = a.type_id
                    join account_icon ai on
                        a.icon_id = ai.id
                    left join transaction t on
                        ua.id = t.user_account_id
                    left join account_statement as_ext on
                        a.id = as_ext.account_id
                    where
                        user_id in (:userIds)
                    group by
                        ua.id,
                        ua.account_id,
                        ua.user_id,
                        ua.user_account_name,
                        type_id,
                        ai.icon,
                        a.name,
                        type_1,
                        type_2,
                        type_3,
                        t.closing_balance,
                        t.date,
                        t.user_account_id
                    ) where has_transactions = false or user_account_id_rank = 1
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("userIds", userIds);

        List<UserAccount> userAccounts = namedParameterJdbcTemplate.query(sql, params, (rs, rowNum) -> {
            BigDecimal balance = rs.getObject("closing_balance") != null ?
                    rs.getBigDecimal("closing_balance") : BigDecimal.ZERO;

            String balanceDate = rs.getObject("closing_balance_date") != null ?
                    rs.getDate("closing_balance_date").toString() : null;

            return UserAccount.builder()
                    .userAccountId(rs.getInt("user_account_id"))
                    .accountId(rs.getInt("account_id"))
                    .userId(rs.getInt("user_id"))
                    .userAccountName(rs.getString("user_account_name"))
                    .accountTypeId(rs.getInt("account_type_id"))
                    .accountName(rs.getString("account_name"))
                    .statementFileExtensions(rs.getString("statement_file_extensions"))
                    .icon(rs.getString("icon"))
                    .accountType1(rs.getString("account_type_1"))
                    .accountType2(rs.getString("account_type_2"))
                    .accountType3(rs.getString("account_type_3"))
                    .latestBalance(balance)
                    .latestBalanceDate(balanceDate)
                    .build();
        });

        logger.info("Retrieved {} user accounts for user_ids: {} from postgres", userAccounts.size(), userIds);
        return userAccounts;
    }
    
    @Override
    public int saveUserAccount(UserAccountSaveRequest request) {
        logger.info("Creating new user account for user_id: {}, account_id: {}", request.userId(), request.accountId());
        
        String sql = """
                INSERT INTO user_account (user_id, account_id, user_account_name)
                VALUES (:userId, :accountId, :userAccountName)
                RETURNING id
                """;
                
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("userId", request.userId());
        params.addValue("accountId", request.accountId());
        params.addValue("userAccountName", request.userAccountName());
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        
        namedParameterJdbcTemplate.update(sql, params, keyHolder);
        
        int newUserAccountId = Objects.requireNonNull(keyHolder.getKey()).intValue();
        logger.info("Created new user account with id: {}", newUserAccountId);
        
        return newUserAccountId;
    }
}
