
package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.UserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategory;

import java.util.List;
import java.util.Set;

public interface CategoryDao {
    /**
     * Fetches all categories for a given user ID
     * 
     * @param userIds The ID of the user
     * @return List of user categories
     */
    List<UserCategory> fetchAllCategories(List<Integer> userIds, int batchSize);
    
    /**
     * Deletes categories and their transaction mappings in batches
     * 
     * @param categoryIds The list of category IDs to delete
     * @param batchSize The size of each batch for deletion
     */
    void deleteCategories(List<Integer> categoryIds, int batchSize);
    
    /**
     * Updates category titles in batches
     * 
     * @param categories The list of categories to update
     * @param batchSize The size of each batch for update
     */
    void updateCategories(List<UserCategory> categories, int batchSize);
    
    /**
     * Deletes transaction-category mappings in batches
     * 
     * @param mappings The list of transaction-category mappings to delete
     * @param batchSize The size of each batch for deletion
     */
    void deleteTransactionCategories(List<TransactionUserCategory> mappings, int batchSize);
    
    /**
     * Inserts transaction-category mappings in batches, ignoring duplicates
     * 
     * @param mappings The list of transaction-category mappings to insert
     * @param batchSize The size of each batch for insertion
     */
    void insertTransactionCategories(List<TransactionUserCategory> mappings, int batchSize);

    /**
     * Saves new categories in batches
     * 
     * @param categories The list of categories to save
     * @param batchSize The size of each batch for insertion
     * @return
     */
    void saveCategories(List<UserCategory> categories, int batchSize);
}
