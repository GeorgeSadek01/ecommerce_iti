import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminUser, ApiResponse, ListResponse, PaginationMeta } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private apiUrl = `${environment.apiBaseUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  // Get all users with pagination and filters
  getUsers(
    page: number = 1,
    limit: number = 10,
    query?: string,
    role?: string
  ): Observable<ApiResponse<ListResponse<AdminUser>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (query) {
      params = params.set('query', query);
    }
    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<ApiResponse<ListResponse<AdminUser>>>(this.apiUrl, { params });
  }

  // Get single user
  getUser(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}`);
  }

  // Update user
  updateUser(id: string, data: Partial<AdminUser>): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}`, data);
  }

  // Update user role
  updateUserRole(id: string, role: string): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}/role`, { role });
  }

  // Delete user
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Restore deleted user
  restoreUser(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}/restore`, {});
  }
}
