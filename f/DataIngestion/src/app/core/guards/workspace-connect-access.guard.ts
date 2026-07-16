import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class WorkspaceConnectAccessGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(): Observable<boolean> {
        return this.authService.getWorkspaceConnectAccess().pipe(
            map(response => {
                if (response?.responseCode === 200 && response.result === true) {
                    return true;
                }
                this.router.navigate(['/unauthorized']);
                return false;
            }),
            catchError(error => {
                console.error('Workspace Connect access check failed:', error);
                this.router.navigate(['/unauthorized']);
                return of(false);
            })
        );
    }
}
