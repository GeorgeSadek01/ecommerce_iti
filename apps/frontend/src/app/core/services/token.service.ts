import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

const ACCESS_TOKEN_KEY = 'accessToken';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly tokenSignal = signal<string | null>(null);

  constructor(private readonly storageService: StorageService) {
    const savedToken = this.storageService.getItem(ACCESS_TOKEN_KEY);
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
  }

  clearToken(): void {
    this.tokenSignal.set(null);
    this.storageService.removeItem(ACCESS_TOKEN_KEY);
  }
}
