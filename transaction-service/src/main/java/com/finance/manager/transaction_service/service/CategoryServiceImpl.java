package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dao.CategoryDao;
import com.finance.manager.transaction_service.dto.UserCategory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
}