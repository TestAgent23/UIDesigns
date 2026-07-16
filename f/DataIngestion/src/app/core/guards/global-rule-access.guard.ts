import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalRuleAccessGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.getAccountHasAccessCreateGlobalRule().pipe(
      map(response => {
        if (response?.responseCode === 200 && response.result === true) {
          return true;
        } else {
          this.router.navigate(['/unauthorized']); // or redirect elsewhere
          return false;
        }
      }),
      catchError(error => {
        console.error('Access check failed:', error);
        this.router.navigate(['/unauthorized']);
        return of(false);
      })
    );
  }
}
