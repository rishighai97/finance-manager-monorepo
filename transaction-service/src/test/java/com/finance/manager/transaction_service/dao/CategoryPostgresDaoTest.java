package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.TransactionUserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategoryAction;
import com.finance.manager.transaction_service.dto.UserCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.sql.ResultSet;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryPostgresDaoTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    @InjectMocks
    private CategoryPostgresDao dao;

    @Nested
    @DisplayName("fetchAllCategories")
    class FetchAllCategories {

        @Test
        @DisplayName("maps result rows into UserCategory in a single batch when under the batch size")
        void mapsRowsInSingleBatch() throws Exception {
            ResultSet rs = mock(ResultSet.class);
            when(rs.getInt("id")).thenReturn(1);
            when(rs.getInt("user_id")).thenReturn(1);
            when(rs.getString("category_title")).thenReturn("Salary");

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserCategory> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            List<UserCategory> result = dao.fetchAllCategories(List.of(1), 500);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).categoryTitle()).isEqualTo("Salary");
            verify(jdbcTemplate, times(1)).query(anyString(), any(SqlParameterSource.class), rowMapper());
        }

        @Test
        @DisplayName("splits user ids into multiple batches when there are more ids than the batch size")
        void splitsIntoMultipleBatches() {
            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenReturn(Collections.emptyList());

            dao.fetchAllCategories(List.of(1, 2, 3), 2);

            // batch size 2 over 3 ids -> two query calls (batch [1,2], batch [3])
            verify(jdbcTemplate, times(2)).query(anyString(), any(SqlParameterSource.class), rowMapper());
        }

        @SuppressWarnings("unchecked")
        private RowMapper<UserCategory> rowMapper() {
            return any(RowMapper.class);
        }
    }

    @Nested
    @DisplayName("deleteCategories")
    class DeleteCategories {

        @Test
        @DisplayName("deletes transaction-category mappings before the categories themselves")
        void deletesMappingsBeforeCategories() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);

            dao.deleteCategories(List.of(1, 2), 500);

            verify(jdbcTemplate, times(2)).update(anyString(), any(SqlParameterSource.class));
        }

        @Test
        @DisplayName("does nothing for an empty list")
        void doesNothingForEmptyList() {
            dao.deleteCategories(Collections.emptyList(), 500);

            verify(jdbcTemplate, never()).update(anyString(), any(SqlParameterSource.class));
        }

        @Test
        @DisplayName("does nothing for a null list")
        void doesNothingForNullList() {
            dao.deleteCategories(null, 500);

            verify(jdbcTemplate, never()).update(anyString(), any(SqlParameterSource.class));
        }
    }

    @Nested
    @DisplayName("updateCategories")
    class UpdateCategories {

        @Test
        @DisplayName("batch-updates a non-empty list of categories")
        void batchUpdatesCategories() {
            when(jdbcTemplate.batchUpdate(anyString(), any(MapSqlParameterSource[].class)))
                    .thenReturn(new int[]{1});

            dao.updateCategories(List.of(UserCategory.builder().id(1).categoryTitle("Renamed").build()), 500);

            verify(jdbcTemplate).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }

        @Test
        @DisplayName("does nothing for an empty list")
        void doesNothingForEmptyList() {
            dao.updateCategories(Collections.emptyList(), 500);

            verify(jdbcTemplate, never()).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }
    }

    @Nested
    @DisplayName("deleteTransactionCategories")
    class DeleteTransactionCategories {

        @Test
        @DisplayName("batch-deletes a non-empty list of mappings")
        void batchDeletesMappings() {
            when(jdbcTemplate.batchUpdate(anyString(), any(MapSqlParameterSource[].class)))
                    .thenReturn(new int[]{1});
            TransactionUserCategory mapping = TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(TransactionUserCategoryAction.DELETE).build();

            dao.deleteTransactionCategories(List.of(mapping), 500);

            verify(jdbcTemplate).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }

        @Test
        @DisplayName("does nothing for an empty list")
        void doesNothingForEmptyList() {
            dao.deleteTransactionCategories(Collections.emptyList(), 500);

            verify(jdbcTemplate, never()).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }
    }

    @Nested
    @DisplayName("insertTransactionCategories")
    class InsertTransactionCategories {

        @Test
        @DisplayName("batch-inserts a non-empty list of mappings")
        void batchInsertsMappings() {
            when(jdbcTemplate.batchUpdate(anyString(), any(MapSqlParameterSource[].class)))
                    .thenReturn(new int[]{1});
            TransactionUserCategory mapping = TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(TransactionUserCategoryAction.INSERT).build();

            dao.insertTransactionCategories(List.of(mapping), 500);

            verify(jdbcTemplate).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }

        @Test
        @DisplayName("does nothing for a null list")
        void doesNothingForNullList() {
            dao.insertTransactionCategories(null, 500);

            verify(jdbcTemplate, never()).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }
    }

    @Nested
    @DisplayName("saveCategories")
    class SaveCategories {

        @Test
        @DisplayName("inserts each category individually via the JDBC template")
        void insertsEachCategoryIndividually() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);

            dao.saveCategories(List.of(
                    UserCategory.builder().userId(1).categoryTitle("Salary").build(),
                    UserCategory.builder().userId(1).categoryTitle("Groceries").build()), 500);

            verify(jdbcTemplate, times(2)).update(anyString(), any(SqlParameterSource.class));
        }

        @Test
        @DisplayName("does nothing for an empty list")
        void doesNothingForEmptyList() {
            dao.saveCategories(Collections.emptyList(), 500);

            verify(jdbcTemplate, never()).update(anyString(), any(SqlParameterSource.class));
        }
    }
}
