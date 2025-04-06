package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dto.UserCategory;

import java.util.List;
import java.util.Set;

public interface CategoryService {
    /**
     * Fetches all categories for a given user ID
     * 
     * @param userIuserIdsd The ID of the user
     * @return List of user categories
     */
    List<UserCategory> getAllCategories(List<Integer> userIds);
    
    /**
     * Deletes categories and their transaction mappings
     * 
     * @param categories The list of categories to delete
     */
    void deleteCategories(List<UserCategory> categories);
    
    /**
     * Updates category titles
     * 
     * @param categories The list of categories to update
     */
    void updateCategories(List<UserCategory> categories);
}