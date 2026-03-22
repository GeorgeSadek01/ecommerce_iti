export type AuthStatus = 'success' | 'fail' | 'error';

export type UserRole = 'customer' | 'seller' | 'admin';

export interface ApiResponse<T = unknown> {
  status: AuthStatus;
  message: string;
  data?: T;
  errors?: string[];
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailConfirmed?: boolean;
  avatarUrl?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: Extract<UserRole, 'customer' | 'seller'>;
  storeName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  confirmPassword: string;
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AddressPayload {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface AuthTokensData {
  accessToken: string;
  user: AuthUser;
}
