import { Injectable, signal } from '@angular/core';

const ADMIN_TOKEN_KEY = 'echo.admin.token';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly token = signal('');

  constructor() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    this.token.set(localStorage.getItem(ADMIN_TOKEN_KEY) ?? '');
  }

  isLoggedIn(): boolean {
    return Boolean(this.token());
  }

  setToken(token: string): void {
    this.token.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  }

  logout(): void {
    this.token.set('');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }
}
