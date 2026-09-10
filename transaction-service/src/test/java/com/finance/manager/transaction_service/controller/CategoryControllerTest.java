package com.finance.manager.transaction_service.controller;

import com.finance.manager.transaction_service.dto.TransactionUserCategory;
import com.finance.manager.transaction_service.dto.TransactionUserCategoryAction;
import com.finance.manager.transaction_service.dto.UserCategory;
import com.finance.manager.transaction_service.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController controller;

    @Nested
    @DisplayName("healthcheck")
    class Healthcheck {

        @Test
        @DisplayName("returns status OK without touching the service")
        void returnsStatusOk() {
            assertThat(controller.healthcheck()).isEqualTo(Map.of("status", "OK"));
        }
    }

    @Nested
    @DisplayName("fetchAllCategoriesByUserId")
    class FetchAllCategoriesByUserId {

        @Test
        @DisplayName("returns 200 with the service's categories for valid user ids")
        void returnsCategoriesForValidUserIds() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(1).userId(1).categoryTitle("Salary").build());
            when(categoryService.getAllCategories(List.of(1))).thenReturn(categories);

            ResponseEntity<List<UserCategory>> response = controller.fetchAllCategoriesByUserId(List.of(1));

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(categories);
        }

        @Test
        @DisplayName("rejects an empty user_ids list with a 400 before calling the service")
        void rejectsEmptyUserIds() {
            assertThatThrownBy(() -> controller.fetchAllCategoriesByUserId(Collections.emptyList()))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Please provide a valid user_ids");
        }
    }

    @Nested
    @DisplayName("deleteAllCategories")
    class DeleteAllCategories {

        @Test
        @DisplayName("returns 200 and deletes for a valid list")
        void deletesValidList() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(1).build());

            ResponseEntity<Void> response = controller.deleteAllCategories(categories);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(categoryService).deleteCategories(categories);
        }

        @Test
        @DisplayName("rejects a null list with a 400")
        void rejectsNullList() {
            assertThatThrownBy(() -> controller.deleteAllCategories(null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Please provide a valid list of categories");
        }

        @Test
        @DisplayName("rejects a category with a null id with a 400")
        void rejectsCategoryWithNullId() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(null).build());

            assertThatThrownBy(() -> controller.deleteAllCategories(categories))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each category must have a valid ID");
        }

        @Test
        @DisplayName("rejects a category with a non-positive id with a 400")
        void rejectsCategoryWithNonPositiveId() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(0).build());

            assertThatThrownBy(() -> controller.deleteAllCategories(categories))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each category must have a valid ID");
        }
    }

    @Nested
    @DisplayName("editAllCategories")
    class EditAllCategories {

        @Test
        @DisplayName("returns 200 and edits for a valid list")
        void editsValidList() {
            List<UserCategory> categories = List.of(UserCategory.builder().id(1).categoryTitle("Renamed").build());

            ResponseEntity<Void> response = controller.editAllCategories(categories);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(categoryService).updateCategories(categories);
        }

        @Test
        @DisplayName("rejects an empty list with a 400")
        void rejectsEmptyList() {
            assertThatThrownBy(() -> controller.editAllCategories(Collections.emptyList()))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    @Nested
    @DisplayName("saveAllCategories")
    class SaveAllCategories {

        @Test
        @DisplayName("returns 200 and saves for a valid list")
        void savesValidList() {
            List<UserCategory> categories = List.of(UserCategory.builder().userId(1).categoryTitle("Groceries").build());

            ResponseEntity<Void> response = controller.saveAllCategories(categories);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(categoryService).saveCategories(categories);
        }

        @Test
        @DisplayName("rejects a category with no user id with a 400")
        void rejectsCategoryWithoutUserId() {
            List<UserCategory> categories = List.of(UserCategory.builder().userId(null).categoryTitle("Groceries").build());

            assertThatThrownBy(() -> controller.saveAllCategories(categories))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each category must have a valid user ID");
        }

        @Test
        @DisplayName("rejects a category with a blank title with a 400")
        void rejectsCategoryWithBlankTitle() {
            List<UserCategory> categories = List.of(UserCategory.builder().userId(1).categoryTitle("").build());

            assertThatThrownBy(() -> controller.saveAllCategories(categories))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each category must have a title");
        }
    }

    @Nested
    @DisplayName("editTransactionCategories")
    class EditTransactionCategories {

        @Test
        @DisplayName("returns 200 and edits for a valid list of mappings")
        void editsValidMappings() {
            List<TransactionUserCategory> mappings = List.of(TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(TransactionUserCategoryAction.INSERT).build());

            ResponseEntity<Void> response = controller.editTransactionCategories(mappings);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(categoryService).editTransactionCategories(mappings);
        }

        @Test
        @DisplayName("rejects a mapping with a blank transaction id with a 400")
        void rejectsMappingWithBlankTransactionId() {
            List<TransactionUserCategory> mappings = List.of(TransactionUserCategory.builder()
                    .transactionId(" ").userCategoryId(1).action(TransactionUserCategoryAction.INSERT).build());

            assertThatThrownBy(() -> controller.editTransactionCategories(mappings))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each mapping must have a valid transaction ID");
        }

        @Test
        @DisplayName("rejects a mapping with a non-positive category id with a 400")
        void rejectsMappingWithNonPositiveCategoryId() {
            List<TransactionUserCategory> mappings = List.of(TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(0).action(TransactionUserCategoryAction.INSERT).build());

            assertThatThrownBy(() -> controller.editTransactionCategories(mappings))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each mapping must have a valid user category ID");
        }

        @Test
        @DisplayName("rejects a mapping with a null action with a 400")
        void rejectsMappingWithNullAction() {
            List<TransactionUserCategory> mappings = List.of(TransactionUserCategory.builder()
                    .transactionId("t1").userCategoryId(1).action(null).build());

            assertThatThrownBy(() -> controller.editTransactionCategories(mappings))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Each mapping must have a valid action");
        }
    }
}
