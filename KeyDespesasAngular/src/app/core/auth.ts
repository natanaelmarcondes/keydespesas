import { inject, Service, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
@Service()
export class Auth {
  readonly authenticated = signal(sessionStorage.getItem('keydespesas-session') === 'active');
  login(email: string, password: string): boolean {
    const valid =
      email.trim().toLowerCase() === 'natanaelmarcondes@gmail.com' && password === '050660';
    if (valid) {
      sessionStorage.setItem('keydespesas-session', 'active');
      this.authenticated.set(true);
    }
    return valid;
  }
  logout(): void {
    sessionStorage.removeItem('keydespesas-session');
    this.authenticated.set(false);
  }
}
export const authGuard: CanActivateFn = () =>
  inject(Auth).authenticated() || inject(Router).createUrlTree(['/login']);
