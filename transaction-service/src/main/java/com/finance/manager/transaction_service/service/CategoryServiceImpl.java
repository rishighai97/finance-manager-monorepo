
package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dao.CategoryDao;
import com.finance.manager.transaction_service.dto.UserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategoryAction;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryServiceImpl.class);
    private final CategoryDao categoryDao;
    
    // Configurable batch size for database operations
    private final int batchSize = 500;

    @Override
    public List<UserCategory> getAllCategories(List<Integer> userIds) {
        logger.info("Getting all categories for user ID: {} and batch size: {}", userIds, batchSize);
        return categoryDao.fetchAllCategories(userIds, batchSize);
    }

    @Override
    public void deleteCategories(List<UserCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            logger.info("No categories to delete");
            return;
        }
        
        logger.info("Deleting {} categories", categories.size());
        
        // Extract category IDs from the input
        List<Integer> categoryIds = categories.stream()
                .map(UserCategory::id)
                .collect(Collectors.toList());
        
        categoryDao.deleteCategories(categoryIds, batchSize);
    }

    @Override
    public void updateCategories(List<UserCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            logger.info("No categories to update");
            return;
        }
        
        logger.info("Updating {} categories", categories.size());
        categoryDao.updateCategories(categories, batchSize);
    }
    
    @Override
    @Transactional
    public void editTransactionCategories(List<TransactionUserCategory> mappings) {
        if (mappings == null || mappings.isEmpty()) {
            logger.info("No transaction-category mappings to edit");
            return;
        }
        
        // Segregate mappings by action
        List<TransactionUserCategory> deleteList = mappings.stream()
                .filter(m -> m.action() == TransactionUserCategoryAction.DELETE)
                .collect(Collectors.toList());
        
        List<TransactionUserCategory> insertList = mappings.stream()
                .filter(m -> m.action() == TransactionUserCategoryAction.INSERT)
                .collect(Collectors.toList());
        
        logger.info("Processing {} transaction-category mappings: {} to delete, {} to insert", 
                mappings.size(), deleteList.size(), insertList.size());
        
        // First delete all mappings marked for deletion
        if (!deleteList.isEmpty()) {
            categoryDao.deleteTransactionCategories(deleteList, batchSize);
        }
        
        // Then insert all mappings marked for insertion
        if (!insertList.isEmpty()) {
            categoryDao.insertTransactionCategories(insertList, batchSize);
        }
    }
    
    @Override
    public void saveCategories(List<UserCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            logger.info("No categories to save");
            return;
        }
        
        logger.info("Saving {} new categories", categories.size());
        categoryDao.saveCategories(categories, batchSize);
    }
}
