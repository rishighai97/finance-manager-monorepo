import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { AuthGuard } from './auth-guard.service';
import { UserService } from './user.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let isAuthenticated$: BehaviorSubject<boolean>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(false);
    const userServiceSpy = { isAuthenticated$ };
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  describe('canActivate', () => {
    it('allows navigation when the user is authenticated', async () => {
      isAuthenticated$.next(true);

      const result = await firstValueFrom(guard.canActivate(null as any, null as any) as any);

      expect(result).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });

    it('redirects to /auth when the user is not authenticated', async () => {
      isAuthenticated$.next(false);
      const urlTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(urlTree);

      const result = await firstValueFrom(guard.canActivate(null as any, null as any) as any);

      expect(result).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth']);
    });
  });
});
