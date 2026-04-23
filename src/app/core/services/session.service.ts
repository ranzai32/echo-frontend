import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';

const TOKEN_KEY = 'echo.token';
const PSEUDONYM_KEY = 'echo.pseudonym';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly token = signal('');
  readonly pseudonym = signal('');
  readonly userID = signal('');

  constructor(private readonly api: ApiService) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    this.token.set(localStorage.getItem(TOKEN_KEY) ?? '');
    this.pseudonym.set(localStorage.getItem(PSEUDONYM_KEY) ?? '');
    this.userID.set(this.extractUserID(this.token()));
  }

  async ensureSession(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.token()) {
      await this.register();
      return;
    }

    try {
      const refreshed = await this.api.refresh(this.token());
      this.token.set(refreshed.token);
      this.userID.set(this.extractUserID(refreshed.token));
      this.persist();
    } catch {
      await this.register();
    }
  }

  async register(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const auth = await this.api.register();
    this.token.set(auth.token);
    this.pseudonym.set(auth.pseudonym);
    this.userID.set(this.extractUserID(auth.token));
    this.persist();
  }

  private persist(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(TOKEN_KEY, this.token());
    localStorage.setItem(PSEUDONYM_KEY, this.pseudonym());
  }

  private extractUserID(token: string): string {
    if (!token) {
      return '';
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized));
      return (decoded.user_id as string) ?? '';
    } catch {
      return '';
    }
  }
}
