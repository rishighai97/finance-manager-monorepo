package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dao.CategoryDao;
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

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryDao categoryDao;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Nested
    @DisplayName("getAllCategories")
    class GetAllCategories {

        @Test
        @DisplayName("returns whatever the DAO returns for the given user ids")
        void delegatesToDao() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(1).userId(1).categoryTitle("Salary").build());
            when(categoryDao.fetchAllCategories(List.of(1), 500)).thenReturn(categories);

            assertThat(categoryService.getAllCategories(List.of(1))).isEqualTo(categories);
        }
    }

    @Nested
    @DisplayName("deleteCategories")
    class DeleteCategories {

        @Test
        @DisplayName("extracts ids and deletes them via the DAO")
        void extractsIdsAndDeletes() {
            List<UserCategory> categories = List.of(
                    UserCategory.builder().id(1).build(),
                    UserCategory.builder().id(2).build());

            categoryService.deleteCategories(categories);

            verify(categoryDao).deleteCategories(List.of(1, 2), 500);
        }

        @Test
        @DisplayName("does nothing when given an empty list")
        void doesNothingForEmptyList() {
            categoryService.deleteCategories(Collections.emptyList());

            verify(categoryDao, never()).deleteCategories(anyList(), anyInt());
        }

        @Test
        @DisplayName("does nothing when given null")
        void doesNothingForNull() {
            categoryService.deleteCategories(null);

            verify(categoryDao, never()).deleteCategories(anyList(), anyInt());
        }
    }

    @Nested
    @DisplayName("updateCategories")
    class UpdateCategories {

        @Test
        @DisplayName("delegates to the DAO for a non-empty list")
        void delegatesToDao() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(1).categoryTitle("Renamed").build());

            categoryService.updateCategories(categories);

            verify(categoryDao).updateCategories(categories, 500);
        }

        @Test
        @DisplayName("does nothing for an empty list")
        void doesNothingForEmptyList() {
            categoryService.updateCategories(Collections.emptyList());

            verify(categoryDao, never()).updateCategories(anyList(), anyInt());
        }
    }

    @Nested
    @DisplayName("saveCategories")
    class SaveCategories {

        @Test
        @DisplayName("delegates to the DAO for a non-empty list")
        void delegatesToDao() {
            List<UserCategory> categories = List.of(UserCategory.builder().userId(1).categoryTitle("Groceries").build());

            categoryService.saveCategories(categories);

            verify(categoryDao).saveCategories(categories, 500);
        }

        @Test
        @DisplayName("does nothing for a null list")
        void doesNothingForNull() {
            categoryService.saveCategories(null);

            verify(categoryDao, never()).saveCategories(anyList(), anyInt());
        }
    }

    @Nested
    @DisplayName("editTransactionCategories")
    class EditTransactionCategories {

        @Test
        @DisplayName("splits mappings into delete and insert batches and calls the DAO for each")
        void splitsIntoDeleteAndInsertBatches() {
            TransactionUserCategory toDelete = TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(TransactionUserCategoryAction.DELETE).build();
            TransactionUserCategory toInsert = TransactionUserCategory.builder()
                    .transactionId("t2").userCategoryId(2).action(TransactionUserCategoryAction.INSERT).build();

            categoryService.editTransactionCategories(List.of(toDelete, toInsert));

            verify(categoryDao).deleteTransactionCategories(List.of(toDelete), 500);
            verify(categoryDao).insertTransactionCategories(List.of(toInsert), 500);
        }

        @Test
        @DisplayName("skips the delete call entirely when there is nothing to delete")
        void skipsDeleteWhenNothingToDelete() {
            TransactionUserCategory toInsert = TransactionUserCategory.builder()
                    .transactionId("t2").userCategoryId(2).action(TransactionUserCategoryAction.INSERT).build();

            categoryService.editTransactionCategories(List.of(toInsert));

            verify(categoryDao, never()).deleteTransactionCategories(anyList(), anyInt());
            verify(categoryDao).insertTransactionCategories(List.of(toInsert), 500);
        }

        @Test
        @DisplayName("skips the insert call entirely when there is nothing to insert")
        void skipsInsertWhenNothingToInsert() {
            TransactionUserCategory toDelete = TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(TransactionUserCategoryAction.DELETE).build();

            categoryService.editTransactionCategories(List.of(toDelete));

            verify(categoryDao).deleteTransactionCategories(List.of(toDelete), 500);
            verify(categoryDao, never()).insertTransactionCategories(anyList(), anyInt());
        }

        @Test
        @DisplayName("does nothing when given an empty list")
        void doesNothingForEmptyList() {
            categoryService.editTransactionCategories(Collections.emptyList());

            verify(categoryDao, never()).deleteTransactionCategories(anyList(), anyInt());
            verify(categoryDao, never()).insertTransactionCategories(anyList(), anyInt());
        }
    }
}
