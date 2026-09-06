import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { UserService } from './user.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private userService: UserService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip interceptor for auth endpoints
    if (request.url.includes('/auth/login') || request.url.includes('/auth/signup')) {
      return next.handle(request);
    }

    // Add auth token if available
    if (this.userService.token) {
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.userService.token}`
        }
      });
      
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Handle 401 Unauthorized errors
          if (error.status === 401) {
            // Auto logout on authentication failures
            this.userService.logout().subscribe(() => {
              this.router.navigate(['/auth']);
            });
          }
          return throwError(() => error);
        })
      );
    }
    
    // No token available, proceed with original request
    return next.handle(request);
  }
}