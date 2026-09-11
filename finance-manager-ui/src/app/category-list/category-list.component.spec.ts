import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { CategoryListComponent } from "./category-list.component";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";

describe("CategoryListComponent", () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;

  let userCategories$: Subject<UserCategory[]>;
  let categoryServiceStub: {
    userCategories$: Subject<UserCategory[]>;
    loadUserCategories: jasmine.Spy;
    refreshCategories: jasmine.Spy;
  };

  beforeEach(waitForAsync(() => {
    userCategories$ = new Subject<UserCategory[]>();
    categoryServiceStub = {
      userCategories$,
      loadUserCategories: jasmine.createSpy("loadUserCategories"),
      refreshCategories: jasmine.createSpy("refreshCategories"),
    };

    TestBed.configureTestingModule({
      imports: [CategoryListComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CategoryService, useValue: categoryServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Error handling on the category fetch (new - previously had no error UI at all)", () => {
    it("sets hasError and clears isLoading when the fetch errors", () => {
      userCategories$.error(new Error("network down"));

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it("retryLoadCategories clears hasError and calls through to a refresh", () => {
      userCategories$.error(new Error("network down"));
      expect(component.hasError).toBe(true);

      component.retryLoadCategories();

      expect(component.hasError).toBe(false);
      expect(categoryServiceStub.refreshCategories).toHaveBeenCalled();
    });
  });
});
