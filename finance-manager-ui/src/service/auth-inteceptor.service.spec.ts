import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { AuthInterceptor } from './auth-inteceptor.service';
import { UserService } from './user.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let userService: { token: string | null; logout: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    userService = { token: null, logout: jasmine.createSpy('logout') };
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });
    interceptor = TestBed.inject(AuthInterceptor);
  });

  function fakeHandler(response$: Observable<any>): jasmine.SpyObj<HttpHandler> {
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handler.handle.and.returnValue(response$);
    return handler;
  }

  it('passes auth/login requests through untouched, even with no token', async () => {
    userService.token = 'my-token';
    const request = new HttpRequest('POST', '/auth/login', {});
    const handler = fakeHandler(of('response' as any));

    await firstValueFrom(interceptor.intercept(request, handler));

    const forwarded = handler.handle.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(forwarded.headers.has('Authorization')).toBeFalse();
  });

  it('passes the request through unmodified when there is no token', async () => {
    const request = new HttpRequest('GET', '/account/v1/fetch_all');
    const handler = fakeHandler(of('response' as any));

    await firstValueFrom(interceptor.intercept(request, handler));

    const forwarded = handler.handle.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(forwarded.headers.has('Authorization')).toBeFalse();
  });

  it('adds a Bearer Authorization header when a token is present', async () => {
    userService.token = 'my-token';
    const request = new HttpRequest('GET', '/account/v1/fetch_all');
    const handler = fakeHandler(of('response' as any));

    await firstValueFrom(interceptor.intercept(request, handler));

    const forwarded = handler.handle.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(forwarded.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('logs out and navigates to /auth on a 401 while a token was set', async () => {
    userService.token = 'my-token';
    userService.logout.and.returnValue(of(true));
    const request = new HttpRequest('GET', '/account/v1/fetch_all');
    const error = new HttpErrorResponse({ status: 401 });
    const handler = fakeHandler(throwError(() => error));

    await expectAsync(firstValueFrom(interceptor.intercept(request, handler))).toBeRejected();

    expect(userService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth']);
  });

  it('does not log out on a non-401 error while a token was set', async () => {
    userService.token = 'my-token';
    const request = new HttpRequest('GET', '/account/v1/fetch_all');
    const error = new HttpErrorResponse({ status: 500 });
    const handler = fakeHandler(throwError(() => error));

    await expectAsync(firstValueFrom(interceptor.intercept(request, handler))).toBeRejected();

    expect(userService.logout).not.toHaveBeenCalled();
  });
});
