import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { StatementUploaderComponent } from './statement-uploader.component';

describe('StatementUploaderComponent', () => {
  let component: StatementUploaderComponent;
  let fixture: ComponentFixture<StatementUploaderComponent>;

  beforeEach(waitForAsync(() => {
    // StatementUploaderComponent is standalone - see LogoutComponent's spec
    // for why this moved from `declarations` to `imports` (JIRA_7).
    TestBed.configureTestingModule({
      imports: [StatementUploaderComponent, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StatementUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
