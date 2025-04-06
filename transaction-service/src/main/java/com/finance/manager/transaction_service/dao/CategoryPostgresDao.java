
package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.UserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Repository
public class CategoryPostgresDao implements CategoryDao {

    private static final Logger logger = LoggerFactory.getLogger(CategoryPostgresDao.class);
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    public CategoryPostgresDao(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Override
    public List<UserCategory> fetchAllCategories(List<Integer> userIds, int batchSize) {
        logger.info("Fetching all categories for user IDs from postgres: {}", userIds);
        List<UserCategory> result = new ArrayList<>();
        String sql = """
                SELECT id, user_id, category_title
                FROM user_category
                WHERE user_id in (:userIds)
                ORDER BY category_title
                """;

        // Process in batches
        for (int i = 0; i < userIds.size(); i += batchSize) {
            int end = Math.min(userIds.size(), i + batchSize);
            List<Integer> batchIds = userIds.subList(i, end);

            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("userIds", batchIds);


            List<UserCategory> categories = namedParameterJdbcTemplate.query(sql, params, (rs, rowNum) ->
                    UserCategory.builder()
                            .id(rs.getInt("id"))
                            .userId(rs.getInt("user_id"))
                            .categoryTitle(rs.getString("category_title"))
                            .build()
            );
            result.addAll(categories);
            logger.info("Retrieved {} categories for user IDs: {}", categories.size(), batchIds);
        }

        return result;
    }

    @Override
    @Transactional
    public void deleteCategories(List<Integer> categoryIds, int batchSize) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            logger.info("No categories to delete");
            return;
        }

        logger.info("Deleting {} categories with batch size {}", categoryIds.size(), batchSize);
        
        // Process in batches
        for (int i = 0; i < categoryIds.size(); i += batchSize) {
            int end = Math.min(categoryIds.size(), i + batchSize);
            List<Integer> batchIds = categoryIds.subList(i, end);
            
            // First delete from transaction_user_category
            deleteTransactionCategoryMappings(batchIds);
            
            // Then delete from user_category
            deleteUserCategories(batchIds);
            
            logger.info("Processed batch {} to {} of {} categories", i, end, categoryIds.size());
        }
    }

    private void deleteTransactionCategoryMappings(List<Integer> categoryIds) {
        String sql = """
                DELETE FROM transaction_user_category
                WHERE user_category_id IN (:categoryIds)
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("categoryIds", categoryIds);

        int deleted = namedParameterJdbcTemplate.update(sql, params);
        logger.info("Deleted {} transaction category mappings", deleted);
    }

    private void deleteUserCategories(List<Integer> categoryIds) {
        String sql = """
                DELETE FROM user_category
                WHERE id IN (:categoryIds)
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("categoryIds", categoryIds);

        int deleted = namedParameterJdbcTemplate.update(sql, params);
        logger.info("Deleted {} user categories", deleted);
    }

    @Override
    @Transactional
    public void updateCategories(List<UserCategory> categories, int batchSize) {
        if (categories == null || categories.isEmpty()) {
            logger.info("No categories to update");
            return;
        }

        logger.info("Updating {} categories with batch size {}", categories.size(), batchSize);
        
        // Process in batches
        for (int i = 0; i < categories.size(); i += batchSize) {
            int end = Math.min(categories.size(), i + batchSize);
            List<UserCategory> batch = categories.subList(i, end);
            
            updateCategoryBatch(batch);
            
            logger.info("Processed update batch {} to {} of {} categories", i, end, categories.size());
        }
    }

    private void updateCategoryBatch(List<UserCategory> categories) {
        String sql = """
                UPDATE user_category
                SET category_title = :categoryTitle
                WHERE id = :id
                """;

        List<MapSqlParameterSource> paramsList = new ArrayList<>();
        
        for (UserCategory category : categories) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("id", category.id())
                    .addValue("categoryTitle", category.categoryTitle());
            paramsList.add(params);
        }

        int[] updated = namedParameterJdbcTemplate.batchUpdate(sql, paramsList.toArray(new MapSqlParameterSource[0]));
        logger.info("Updated {} categories in batch", updated.length);
    }
    
    @Override
    @Transactional
    public void deleteTransactionCategories(List<TransactionUserCategory> mappings, int batchSize) {
        if (mappings == null || mappings.isEmpty()) {
            logger.info("No transaction-category mappings to delete");
            return;
        }

        logger.info("Deleting {} transaction-category mappings with batch size {}", mappings.size(), batchSize);
        
        // Process in batches
        for (int i = 0; i < mappings.size(); i += batchSize) {
            int end = Math.min(mappings.size(), i + batchSize);
            List<TransactionUserCategory> batch = mappings.subList(i, end);
            
            deleteTransactionCategoryBatch(batch);
            
            logger.info("Processed delete batch {} to {} of {} mappings", i, end, mappings.size());
        }
    }

    private void deleteTransactionCategoryBatch(List<TransactionUserCategory> mappings) {
        String sql = """
                DELETE FROM transaction_user_category
                WHERE transaction_id = :transactionId AND user_category_id = :userCategoryId
                """;

        List<MapSqlParameterSource> paramsList = new ArrayList<>();
        
        for (TransactionUserCategory mapping : mappings) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("transactionId", mapping.transactionId())
                    .addValue("userCategoryId", mapping.userCategoryId());
            paramsList.add(params);
        }

        int[] deleted = namedParameterJdbcTemplate.batchUpdate(sql, paramsList.toArray(new MapSqlParameterSource[0]));
        logger.info("Deleted {} transaction-category mappings in batch", deleted.length);
    }
    
    @Override
    @Transactional
    public void insertTransactionCategories(List<TransactionUserCategory> mappings, int batchSize) {
        if (mappings == null || mappings.isEmpty()) {
            logger.info("No transaction-category mappings to insert");
            return;
        }

        logger.info("Inserting {} transaction-category mappings with batch size {}", mappings.size(), batchSize);
        
        // Process in batches
        for (int i = 0; i < mappings.size(); i += batchSize) {
            int end = Math.min(mappings.size(), i + batchSize);
            List<TransactionUserCategory> batch = mappings.subList(i, end);
            
            insertTransactionCategoryBatch(batch);
            
            logger.info("Processed insert batch {} to {} of {} mappings", i, end, mappings.size());
        }
    }

    private void insertTransactionCategoryBatch(List<TransactionUserCategory> mappings) {
        String sql = """
                INSERT INTO transaction_user_category (transaction_id, user_category_id)
                VALUES (:transactionId, :userCategoryId)
                ON CONFLICT (transaction_id, user_category_id) DO NOTHING
                """;

        List<MapSqlParameterSource> paramsList = new ArrayList<>();
        
        for (TransactionUserCategory mapping : mappings) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("transactionId", mapping.transactionId())
                    .addValue("userCategoryId", mapping.userCategoryId());
            paramsList.add(params);
        }

        int[] inserted = namedParameterJdbcTemplate.batchUpdate(sql, paramsList.toArray(new MapSqlParameterSource[0]));
        logger.info("Inserted {} transaction-category mappings in batch", inserted.length);
    }
    
    @Override
    @Transactional
    public void saveCategories(List<UserCategory> categories, int batchSize) {
        if (categories == null || categories.isEmpty()) {
            logger.info("No categories to save");
            return;
        }

        logger.info("Saving {} new categories with batch size {}", categories.size(), batchSize);
        
        // Process in batches
        for (int i = 0; i < categories.size(); i += batchSize) {
            int end = Math.min(categories.size(), i + batchSize);
            List<UserCategory> batch = categories.subList(i, end);
            
            saveCategoryBatch(batch);
            
            logger.info("Processed save batch {} to {} of {} categories", i, end, categories.size());
        }
    }
    
    private void saveCategoryBatch(List<UserCategory> categories) {
        String sql = """
                INSERT INTO user_category (user_id, category_title)
                VALUES (:userId, :categoryTitle)
                """;
        for (UserCategory category : categories) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("userId", category.userId())
                    .addValue("categoryTitle", category.categoryTitle());
            
            namedParameterJdbcTemplate.update(sql, params);
        }
    }
}
