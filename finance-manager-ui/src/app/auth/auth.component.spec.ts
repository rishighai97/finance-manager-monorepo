import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { ToastService } from '../../service/toast.service';
import { UserService } from '../../service/user.service';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let userService: jasmine.SpyObj<UserService> & { isAuthenticated$: BehaviorSubject<boolean> };
  let router: jasmine.SpyObj<Router>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(waitForAsync(() => {
    const isAuthenticated$ = new BehaviorSubject<boolean>(false);
    userService = jasmine.createSpyObj('UserService', ['login', 'signup'], { isAuthenticated$ }) as any;
    router = jasmine.createSpyObj('Router', ['navigate']);
    toastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    // AuthComponent is standalone - see JIRA_7's Implementation notes for why
    // this spec (and several sibling ones) previously used the NgModule-style
    // `declarations` array, which Angular 19's TestBed rejects for standalone
    // components, so this spec never actually ran before.
    TestBed.configureTestingModule({
      imports: [AuthComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('redirects to /tabs/tab1 when already authenticated', () => {
      userService.isAuthenticated$.next(true);

      expect(router.navigate).toHaveBeenCalledWith(['/tabs/tab1']);
    });

    it('does not redirect while unauthenticated', () => {
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('selectAuthMode (replaces segmentChanged/switchMode now that the mode switch is two plain underline tabs, not an ion-segment)', () => {
    it('switches auth mode and clears any error message', () => {
      component.errorMessage = 'stale error';

      component.selectAuthMode('signup');

      expect(component.authMode).toBe('signup');
      expect(component.errorMessage).toBe('');
    });

    it('switches back to login from signup', () => {
      component.authMode = 'signup';

      component.selectAuthMode('login');

      expect(component.authMode).toBe('login');
    });
  });

  describe('login', () => {
    it('shows a validation error and does not call the service when fields are empty', () => {
      component.loginUsername = '';
      component.loginPassword = '';

      component.login();

      expect(component.errorMessage).toBe('Please enter both username and password');
      expect(userService.login).not.toHaveBeenCalled();
    });

    it('navigates to /tabs/tab1 and shows a success toast on a successful login', () => {
      component.loginUsername = 'user';
      component.loginPassword = 'pass';
      userService.login.and.returnValue(of(true));

      component.login();

      expect(component.isLoading).toBeFalse();
      expect(toastService.showSuccess).toHaveBeenCalledWith('Login successful');
      expect(router.navigate).toHaveBeenCalledWith(['/tabs/tab1']);
    });

    it('shows an error message when the service reports failure without throwing', () => {
      component.loginUsername = 'user';
      component.loginPassword = 'wrong';
      userService.login.and.returnValue(of(false));

      component.login();

      expect(component.errorMessage).toBe('Login failed. Please check your credentials.');
    });

    it('shows the error message from a thrown error', () => {
      component.loginUsername = 'user';
      component.loginPassword = 'wrong';
      userService.login.and.returnValue(throwError(() => new Error('Incorrect password')));

      component.login();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Incorrect password');
    });
  });

  describe('signup', () => {
    it('shows a validation error and does not call the service when fields are empty', () => {
      component.signupUsername = '';
      component.signupPassword = '';

      component.signup();

      expect(component.errorMessage).toBe('Username and password are required');
      expect(userService.signup).not.toHaveBeenCalled();
    });

    it('switches to login mode and pre-fills credentials on successful signup', () => {
      component.signupUsername = 'newuser';
      component.signupPassword = 'secret';
      userService.signup.and.returnValue(of(true));

      component.signup();

      expect(toastService.showSuccess).toHaveBeenCalledWith('Account created successfully');
      expect(component.authMode).toBe('login');
      expect(component.loginUsername).toBe('newuser');
      expect(component.loginPassword).toBe('secret');
    });

    it('shows an error message when signup reports failure without throwing', () => {
      component.signupUsername = 'existing';
      component.signupPassword = 'secret';
      userService.signup.and.returnValue(of(false));

      component.signup();

      expect(component.errorMessage).toBe('Failed to create account. Please try again.');
    });

    it('shows the error message from a thrown error', () => {
      component.signupUsername = 'existing';
      component.signupPassword = 'secret';
      userService.signup.and.returnValue(throwError(() => new Error('Username already taken')));

      component.signup();

      expect(component.errorMessage).toBe('Username already taken');
    });
  });
});
