import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const isTryingToAccessRoot = state.url === '/';

    if (isLoggedIn && isTryingToAccessRoot) {
      this.router.navigate(['/chat']);
      return false;
    }

    if (!isLoggedIn && !isTryingToAccessRoot) {
      this.router.navigate(['']);
      return false;
    }

    return true;
  }
}