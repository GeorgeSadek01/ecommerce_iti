import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    return this.http.get<unknown>(this.apiUrl, { params }).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const success = (res.success as boolean) === true || (res.status as string) === 'success';
        const data = (res['data'] ?? {}) as any;
        const users = (data['users'] ?? data['items'] ?? []) as unknown[];

        const items: AdminUser[] = (users || []).map((uUnk) => {
          const u = uUnk as any;
          return {
            _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
            firstName: (u['firstName'] as string) ?? '',
            lastName: (u['lastName'] as string) ?? '',
            email: (u['email'] as string) ?? '',
            role: (u['role'] as AdminUser['role']) ?? 'customer',
            isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
            avatarUrl: (u['avatarUrl'] as string) ?? undefined,
            createdAt: (u['createdAt'] as string) ?? '',
            updatedAt: (u['updatedAt'] as string) ?? '',
            isDeleted: (u['isDeleted'] as boolean) ?? undefined,
          } as AdminUser;
        });

        const pagination = (data['pagination'] ?? data['meta'] ?? res['meta'] ?? {}) as any;
        const meta: PaginationMeta = {
          page: (pagination['page'] as number) ?? (pagination['currentPage'] as number) ?? 1,
          limit: (pagination['limit'] as number) ?? (pagination['perPage'] as number) ?? 10,
          total: (pagination['total'] as number) ?? 0,
          pages: (pagination['totalPages'] as number) ?? (pagination['pages'] as number) ?? 1,
        };

        const normalized: ApiResponse<ListResponse<AdminUser>> = {
          success,
          message: (res.message as string) ?? (res.msg as string) ?? '',
          data: {
            items,
            meta,
          },
        };

        return normalized;
      })
    );
  }

  // Get single user
  getUser(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const success = (res.success as boolean) === true || (res.status as string) === 'success';
        const data = (res['data'] ?? null) as any;
        const u = data ? ((data['user'] ?? data) as any) : null;
        if (!u) {
          return { success, message: (res.message as string) ?? '' } as ApiResponse<AdminUser>;
        }

        const user: AdminUser = {
          _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
          firstName: (u['firstName'] as string) ?? '',
          lastName: (u['lastName'] as string) ?? '',
          email: (u['email'] as string) ?? '',
          role: (u['role'] as AdminUser['role']) ?? 'customer',
          isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
          avatarUrl: (u['avatarUrl'] as string) ?? undefined,
          createdAt: (u['createdAt'] as string) ?? '',
          updatedAt: (u['updatedAt'] as string) ?? '',
          isDeleted: (u['isDeleted'] as boolean) ?? undefined,
        };

        return { success, message: (res.message as string) ?? '', data: user } as ApiResponse<AdminUser>;
      })
    );
  }

  // Update user
  updateUser(id: string, data: Partial<AdminUser>): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<unknown>(`${this.apiUrl}/${id}`, data).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const dataObj = (res['data'] ?? null) as any;
        const u = dataObj ? ((dataObj['user'] ?? dataObj) as any) : null;
        if (!u)
          return {
            success: (res['status'] as string) === 'success',
            message: (res['message'] as string) ?? '',
          } as ApiResponse<AdminUser>;
        const user: AdminUser = {
          _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
          firstName: (u['firstName'] as string) ?? '',
          lastName: (u['lastName'] as string) ?? '',
          email: (u['email'] as string) ?? '',
          role: (u['role'] as AdminUser['role']) ?? 'customer',
          isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
          avatarUrl: (u['avatarUrl'] as string) ?? undefined,
          createdAt: (u['createdAt'] as string) ?? '',
          updatedAt: (u['updatedAt'] as string) ?? '',
          isDeleted: (u['isDeleted'] as boolean) ?? undefined,
        };
        return {
          success: (res['status'] as string) === 'success' || (res['success'] as boolean) === true,
          message: (res['message'] as string) ?? '',
          data: user,
        } as ApiResponse<AdminUser>;
      })
    );
  }

  // Update user role
  updateUserRole(id: string, role: string): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<unknown>(`${this.apiUrl}/${id}/role`, { role }).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const dataObj = (res['data'] ?? null) as any;
        const u = dataObj ? ((dataObj['user'] ?? dataObj) as any) : null;
        if (!u)
          return {
            success: (res['status'] as string) === 'success',
            message: (res['message'] as string) ?? '',
          } as ApiResponse<AdminUser>;
        const user: AdminUser = {
          _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
          firstName: (u['firstName'] as string) ?? '',
          lastName: (u['lastName'] as string) ?? '',
          email: (u['email'] as string) ?? '',
          role: (u['role'] as AdminUser['role']) ?? 'customer',
          isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
          avatarUrl: (u['avatarUrl'] as string) ?? undefined,
          createdAt: (u['createdAt'] as string) ?? '',
          updatedAt: (u['updatedAt'] as string) ?? '',
          isDeleted: (u['isDeleted'] as boolean) ?? undefined,
        };
        return {
          success: (res['status'] as string) === 'success' || (res['success'] as boolean) === true,
          message: (res['message'] as string) ?? '',
          data: user,
        } as ApiResponse<AdminUser>;
      })
    );
  }

  // Delete user
  deleteUser(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const dataObj = (res['data'] ?? null) as any;
        const u = dataObj ? ((dataObj['user'] ?? dataObj) as any) : null;
        if (!u)
          return {
            success: (res['status'] as string) === 'success',
            message: (res['message'] as string) ?? '',
          } as ApiResponse<AdminUser>;
        const user: AdminUser = {
          _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
          firstName: (u['firstName'] as string) ?? '',
          lastName: (u['lastName'] as string) ?? '',
          email: (u['email'] as string) ?? '',
          role: (u['role'] as AdminUser['role']) ?? 'customer',
          isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
          avatarUrl: (u['avatarUrl'] as string) ?? undefined,
          createdAt: (u['createdAt'] as string) ?? '',
          updatedAt: (u['updatedAt'] as string) ?? '',
          isDeleted: (u['isDeleted'] as boolean) ?? undefined,
        };
        return {
          success: (res['status'] as string) === 'success' || (res['success'] as boolean) === true,
          message: (res['message'] as string) ?? '',
          data: user,
        } as ApiResponse<AdminUser>;
      })
    );
  }

  // Restore deleted user
  restoreUser(id: string): Observable<ApiResponse<AdminUser>> {
    return this.http.patch<unknown>(`${this.apiUrl}/${id}/restore`, {}).pipe(
      map((resUnk) => {
        const res = resUnk as Record<string, unknown>;
        const dataObj = (res['data'] ?? null) as Record<string, unknown> | null;
        const u = dataObj ? ((dataObj['user'] ?? dataObj) as Record<string, unknown>) : null;
        if (!u)
          return {
            success: (res['status'] as string) === 'success',
            message: (res['message'] as string) ?? '',
          } as ApiResponse<AdminUser>;
        const user: AdminUser = {
          _id: (u['_id'] as string) ?? (u['id'] as string) ?? '',
          firstName: (u['firstName'] as string) ?? '',
          lastName: (u['lastName'] as string) ?? '',
          email: (u['email'] as string) ?? '',
          role: (u['role'] as AdminUser['role']) ?? 'customer',
          isEmailConfirmed: (u['isEmailConfirmed'] as boolean) ?? false,
          avatarUrl: (u['avatarUrl'] as string) ?? undefined,
          createdAt: (u['createdAt'] as string) ?? '',
          updatedAt: (u['updatedAt'] as string) ?? '',
          isDeleted: (u['isDeleted'] as boolean) ?? undefined,
        };
        return {
          success: (res['status'] as string) === 'success' || (res['success'] as boolean) === true,
          message: (res['message'] as string) ?? '',
          data: user,
        } as ApiResponse<AdminUser>;
      })
    );
  }
}
