package com.finance.manager.transaction_service.controller;

import com.finance.manager.transaction_service.dto.UserCategory;
import com.finance.manager.transaction_service.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/category")
@CrossOrigin
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    @GetMapping("/v1/healthcheck")
    public String healthcheck() {
        return "Category API is up and running!";
    }

    @GetMapping("/v1/fetch_all")
    public ResponseEntity<List<UserCategory>> fetchAllCategoriesByUserId(@RequestParam("user_ids") List<Integer> userIds) {
        validateUserIds(userIds);
        
        logger.info("Received request to fetch all categories for user IDs: {}", userIds);
        List<UserCategory> categories = categoryService.getAllCategories(userIds);
        
        return ResponseEntity.ok(categories);
    }

    @DeleteMapping("/v1/delete_all")
    public ResponseEntity<Void> deleteAllCategories(@RequestBody List<UserCategory> categories) {
        validateCategories(categories);
        
        logger.info("Received request to delete {} categories", categories.size());
        categoryService.deleteCategories(categories);
        
        return ResponseEntity.ok().build();
    }

    @PutMapping("/v1/edit_all")
    public ResponseEntity<Void> editAllCategories(@RequestBody List<UserCategory> categories) {
        validateCategories(categories);
        
        logger.info("Received request to edit {} categories", categories.size());
        categoryService.updateCategories(categories);
        
        return ResponseEntity.ok().build();
    }

    private void validateUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please provide a valid user_ids");
        }
    }

    private void validateCategories(List<UserCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Please provide a valid list of categories");
        }
        
        // Validate each category has an ID
        for (UserCategory category : categories) {
            if (category.id() == null || category.id() <= 0) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(400), "Each category must have a valid ID");
            }
        }
    }
}