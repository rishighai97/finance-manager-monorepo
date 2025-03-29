package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.Account;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AccountPostgresDao implements AccountDao {

    private static final Logger logger = LoggerFactory.getLogger(AccountPostgresDao.class);

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    public AccountPostgresDao(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Override
    public List<Account> getAllAccounts() {
        logger.info("Getting all accounts from postgres");

        String sql = """
                select
                    a.id as account_id,
                    a.name as account_name,
                    a.type_id as account_type_id,
                    ai.icon as icon,
                    at.type_1 as account_type_1,
                    at.type_2 as account_type_2,
                    at.type_3 as account_type_3,
                    string_agg(DISTINCT as_ext.extension, ',') as statement_file_extensions
                from
                    account a
                join account_type at on
                    at.id = a.type_id
                join account_icon ai on
                    a.icon_id = ai.id
                left join account_statement as_ext on
                    a.id = as_ext.account_id
                group by
                    a.id,
                    a.name,
                    a.type_id,
                    ai.icon,
                    at.type_1,
                    at.type_2,
                    at.type_3
                """;

        List<Account> accounts = namedParameterJdbcTemplate.query(sql, (rs, rowNum) ->
            Account.builder()
                .accountId(rs.getInt("account_id"))
                .accountName(rs.getString("account_name"))
                .accountTypeId(rs.getInt("account_type_id"))
                .statementFileExtensions(rs.getString("statement_file_extensions"))
                .icon(rs.getString("icon"))
                .accountType1(rs.getString("account_type_1"))
                .accountType2(rs.getString("account_type_2"))
                .accountType3(rs.getString("account_type_3"))
                .build()
        );

        logger.info("Retrieved {} accounts from postgres", accounts.size());
        return accounts;
    }
}