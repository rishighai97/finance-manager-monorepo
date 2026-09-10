import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const authApiUrl = `${environment.apiEndpoints.gatewayService}/auth`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated with no user and no token', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.currentUserId).toBe(0);
    expect(service.token).toBeNull();
  });

  describe('signup', () => {
    it('resolves true when the API returns a created user', async () => {
      const promise = firstValueFrom(service.signup('newuser', 'secret'));

      const req = httpMock.expectOne(`${authApiUrl}/signup`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'newuser', password: 'secret' });
      req.flush({ id: 1, username: 'newuser', isActive: true });

      expect(await promise).toBeTrue();
    });

    it('propagates a server error message', async () => {
      const promise = firstValueFrom(service.signup('existing', 'secret'));

      const req = httpMock.expectOne(`${authApiUrl}/signup`);
      req.flush({ errorDescription: 'Username already taken' }, { status: 409, statusText: 'Conflict' });

      await expectAsync(promise).toBeRejectedWithError('Username already taken');
    });
  });

  describe('login', () => {
    const authResponse = {
      accessToken: 'token-123',
      refreshToken: 'refresh-token-123',
      expiresIn: 3600,
      tokenType: 'Bearer',
      userId: 7,
      username: 'existinguser',
    };

    it('updates authentication state and persists to localStorage on success', async () => {
      const promise = firstValueFrom(service.login('existinguser', 'correct'));

      const req = httpMock.expectOne(`${authApiUrl}/login`);
      req.flush(authResponse);

      expect(await promise).toBeTrue();
      expect(service.isAuthenticated).toBeTrue();
      expect(service.currentUserId).toBe(7);
      expect(service.token).toBe('token-123');
      expect(localStorage.getItem('token')).toBe('token-123');
      expect(JSON.parse(localStorage.getItem('userData')!).username).toBe('existinguser');
    });

    it('leaves the service unauthenticated on a failed login', async () => {
      const promise = firstValueFrom(service.login('existinguser', 'wrong'));

      const req = httpMock.expectOne(`${authApiUrl}/login`);
      req.flush({ errorDescription: 'Incorrect password' }, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(promise).toBeRejected();
      expect(service.isAuthenticated).toBeFalse();
    });
  });

  describe('logout', () => {
    it('clears local state and localStorage regardless of the API response', async () => {
      // authenticate first
      const loginPromise = firstValueFrom(service.login('existinguser', 'correct'));
      httpMock.expectOne(`${authApiUrl}/login`).flush({
        accessToken: 'token-123', refreshToken: 'r', expiresIn: 3600, tokenType: 'Bearer', userId: 7, username: 'existinguser',
      });
      await loginPromise;

      const logoutPromise = firstValueFrom(service.logout());
      httpMock.expectOne(`${authApiUrl}/logout`).flush(null);

      expect(await logoutPromise).toBeTrue();
      expect(service.isAuthenticated).toBeFalse();
      expect(service.currentUserId).toBe(0);
      expect(service.token).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('still resolves true even when the logout API call fails', async () => {
      const logoutPromise = firstValueFrom(service.logout());
      httpMock.expectOne(`${authApiUrl}/logout`).flush('error', { status: 500, statusText: 'Server Error' });

      expect(await logoutPromise).toBeTrue();
    });
  });

  describe('getCurrentUserIdArray', () => {
    it('wraps the current user id in a single-element array', () => {
      expect(service.getCurrentUserIdArray()).toEqual([0]);
    });
  });

  describe('loading a persisted session on construction', () => {
    it('restores authentication state from localStorage', () => {
      localStorage.setItem('userData', JSON.stringify({ id: 3, username: 'restored', isActive: true }));
      localStorage.setItem('token', 'stored-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const restoredService = TestBed.inject(UserService);

      expect(restoredService.isAuthenticated).toBeTrue();
      expect(restoredService.currentUserId).toBe(3);
      expect(restoredService.token).toBe('stored-token');
    });
  });
});
