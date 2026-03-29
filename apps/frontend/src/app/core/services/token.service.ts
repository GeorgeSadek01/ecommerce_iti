import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

const ACCESS_TOKEN_KEY = 'accessToken';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly tokenSignal = signal<string | null>(null);

  constructor(private readonly storageService: StorageService) {
    const savedToken = this.readPersistedToken();
    if (savedToken) {
      this.tokenSignal.set(savedToken);
    }
  }

  get token(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string): void {
    this.tokenSignal.set(token);
    this.storageService.setItem(ACCESS_TOKEN_KEY, token);
    this.writeLocalToken(token);
  }

  clearToken(): void {
    this.tokenSignal.set(null);
    this.storageService.removeItem(ACCESS_TOKEN_KEY);
    this.removeLocalToken();
  }

  private readPersistedToken(): string | null {
    const sessionToken = this.storageService.getItem(ACCESS_TOKEN_KEY);
    if (sessionToken) {
      return sessionToken;
    }

    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private writeLocalToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // Ignore environments where localStorage is unavailable.
    }
  }

  private removeLocalToken(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // Ignore environments where localStorage is unavailable.
    }
  }
}
