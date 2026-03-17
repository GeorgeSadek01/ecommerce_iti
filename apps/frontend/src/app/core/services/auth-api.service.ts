import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Address,
  AddressPayload,
  ApiResponse,
  AuthTokensData,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../types/auth.types';
import { SKIP_AUTH } from '../interceptors/interceptor-tokens';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  readonly currentUser = computed(() => this.userSignal());
  readonly isLoading = computed(() => this.loadingSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  isAuthenticated(): boolean {
    return Boolean(this.tokenService.token);
  }

  register(payload: RegisterPayload): Observable<ApiResponse<{ user: AuthUser }>> {
    return this.http.post<ApiResponse<{ user: AuthUser }>>(`${this.baseUrl}/register`, payload, {
      context: new HttpContext().set(SKIP_AUTH, true),
    });
  }

  confirmEmail(token: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/confirm/${token}`, {
      context: new HttpContext().set(SKIP_AUTH, true),
    });
  }

  login(payload: LoginPayload): Observable<ApiResponse<AuthTokensData>> {
    this.loadingSignal.set(true);
    return this.http
      .post<ApiResponse<AuthTokensData>>(`${this.baseUrl}/login`, payload, {
        withCredentials: true,
        context: new HttpContext().set(SKIP_AUTH, true),
      })
      .pipe(
        tap((response) => this.hydrateSession(response)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  googleLogin(payload: GoogleLoginPayload): Observable<ApiResponse<AuthTokensData>> {
    this.loadingSignal.set(true);
    return this.http
      .post<ApiResponse<AuthTokensData>>(`${this.baseUrl}/google`, payload, {
        withCredentials: true,
        context: new HttpContext().set(SKIP_AUTH, true),
      })
      .pipe(
        tap((response) => this.hydrateSession(response)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  refreshToken(): Observable<string> {
    return this.http
      .post<ApiResponse<{ accessToken: string }>>(
        `${this.baseUrl}/refresh`,
        {},
        {
          withCredentials: true,
          context: new HttpContext().set(SKIP_AUTH, true),
        }
      )
      .pipe(
        map((response) => {
          const accessToken = response.data?.accessToken;
          if (!accessToken) {
            throw new Error('Refresh token response did not include access token.');
          }
          return accessToken;
        }),
        tap((accessToken) => {
          this.tokenService.setToken(accessToken);
        })
      );
  }

  logout(): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  changePassword(payload: ChangePasswordPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/change-password`, payload);
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/forgot-password`, payload, {
      context: new HttpContext().set(SKIP_AUTH, true),
    });
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/reset-password`, payload, {
      context: new HttpContext().set(SKIP_AUTH, true),
    });
  }

  updateProfile(payload: UpdateProfilePayload): Observable<ApiResponse<{ user: AuthUser }>> {
    return this.http.patch<ApiResponse<{ user: AuthUser }>>(`${this.baseUrl}/profile`, payload).pipe(
      tap((response) => {
        const updatedUser = response.data?.user;
        if (updatedUser) {
          this.userSignal.set(updatedUser);
        }
      })
    );
  }

  createAddress(payload: AddressPayload): Observable<ApiResponse<{ address: Address }>> {
    return this.http.post<ApiResponse<{ address: Address }>>(`${this.baseUrl}/addresses`, payload);
  }

  getAddresses(): Observable<ApiResponse<{ addresses: Address[] }>> {
    return this.http.get<ApiResponse<{ addresses: Address[] }>>(`${this.baseUrl}/addresses`);
  }

  getAddressById(addressId: string): Observable<ApiResponse<{ address: Address }>> {
    return this.http.get<ApiResponse<{ address: Address }>>(`${this.baseUrl}/addresses/${addressId}`);
  }

  updateAddress(addressId: string, payload: Partial<AddressPayload>): Observable<ApiResponse<{ address: Address }>> {
    return this.http.patch<ApiResponse<{ address: Address }>>(`${this.baseUrl}/addresses/${addressId}`, payload);
  }

  deleteAddress(addressId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/addresses/${addressId}`);
  }

  clearSession(): void {
    this.tokenService.clearToken();
    this.userSignal.set(null);
    this.loadingSignal.set(false);
  }

  setCurrentUser(user: AuthUser | null): void {
    this.userSignal.set(user);
  }

  private hydrateSession(response: ApiResponse<AuthTokensData>): void {
    const accessToken = response.data?.accessToken;
    const user = response.data?.user;

    if (accessToken && user) {
      this.tokenService.setToken(accessToken);
      this.userSignal.set(user);
    }
  }
}
