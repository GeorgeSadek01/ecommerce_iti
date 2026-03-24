import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AdminSeller, ApiResponse, ListResponse, AdminUser, PaginationMeta } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminSellerService {
  private apiUrl = `${environment.apiBaseUrl}/admin/sellers`;

  constructor(private http: HttpClient) {}

  // Get all sellers with pagination and filters
  getSellers(
    page: number = 1,
    limit: number = 10,
    status?: string,
    query?: string
  ): Observable<ApiResponse<ListResponse<AdminSeller>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<unknown>(this.apiUrl, { params }).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const data = (res.data ?? {}) as any;
        const sellers = (data.sellers ?? data.items ?? []) as unknown[];

        const items: AdminSeller[] = (sellers || []).map((sUnk) => {
          const s = sUnk as any;
          const userObj = s.user as any;
          return {
            _id: (s._id as string) ?? (s.id as string) ?? '',
            userId: (s.userId as any)
              ? ((s.userId as any)._id as string) ?? (s.userId as string)
              : (s.userId as string),
            user: userObj
              ? {
                  _id: (userObj._id as string) ?? (userObj.id as string) ?? '',
                  firstName: (userObj.firstName as string) ?? '',
                  lastName: (userObj.lastName as string) ?? '',
                  email: (userObj.email as string) ?? '',
                  role: (userObj.role as AdminUser['role']) ?? 'customer',
                  isEmailConfirmed: (userObj.isEmailConfirmed as boolean) ?? false,
                  avatarUrl: (userObj.avatarUrl as string) ?? undefined,
                  createdAt: (userObj.createdAt as string) ?? '',
                  updatedAt: (userObj.updatedAt as string) ?? '',
                }
              : undefined,
            storeName: (s.storeName as string) ?? '',
            status: (s.status as string) ?? 'pending',
            totalEarnings: (s.totalEarnings as number) ?? 0,
            logoUrl: (s.logoUrl as string) ?? undefined,
            createdAt: (s.createdAt as string) ?? '',
            updatedAt: (s.updatedAt as string) ?? '',
            isDeleted: (s.isDeleted as boolean) ?? undefined,
          } as AdminSeller;
        });

        const pagination = (data.pagination ?? data.meta ?? res.meta ?? {}) as any;
        const meta: PaginationMeta = {
          page: (pagination.page as number) ?? (pagination.currentPage as number) ?? 1,
          limit: (pagination.limit as number) ?? (pagination.perPage as number) ?? 10,
          total: (pagination.total as number) ?? 0,
          pages: (pagination.totalPages as number) ?? (pagination.pages as number) ?? 1,
        };

        return {
          success: (res.status as string) === 'success' || (res.success as boolean) === true,
          message: (res.message as string) ?? '',
          data: {
            items,
            meta,
          },
        } as ApiResponse<ListResponse<AdminSeller>>;
      })
    );
  }

  // Get single seller
  getSeller(id: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((resUnk) => {
        const res = resUnk as any;
        const data = (res.data ?? null) as any;
        const s = data ? ((data.seller ?? data) as any) : null;
        if (!s)
          return {
            success: (res.status as string) === 'success',
            message: (res.message as string) ?? '',
          } as ApiResponse<AdminSeller>;

        const userObj = s.user as any;
        const seller: AdminSeller = {
          _id: (s._id as string) ?? (s.id as string) ?? '',
          userId: (s.userId as any) ? ((s.userId as any)._id as string) ?? (s.userId as string) : (s.userId as string),
          user: userObj
            ? {
                _id: (userObj._id as string) ?? (userObj.id as string) ?? '',
                firstName: (userObj.firstName as string) ?? '',
                lastName: (userObj.lastName as string) ?? '',
                email: (userObj.email as string) ?? '',
                role: (userObj.role as AdminUser['role']) ?? 'customer',
                isEmailConfirmed: (userObj.isEmailConfirmed as boolean) ?? false,
                avatarUrl: (userObj.avatarUrl as string) ?? undefined,
                createdAt: (userObj.createdAt as string) ?? '',
                updatedAt: (userObj.updatedAt as string) ?? '',
              }
            : undefined,
          storeName: (s.storeName as string) ?? '',
          status: (s.status as string) ?? 'pending',
          totalEarnings: (s.totalEarnings as number) ?? 0,
          logoUrl: (s.logoUrl as string) ?? undefined,
          createdAt: (s.createdAt as string) ?? '',
          updatedAt: (s.updatedAt as string) ?? '',
          isDeleted: (s.isDeleted as boolean) ?? undefined,
        } as AdminSeller;

        return {
          success: (res.status as string) === 'success' || (res.success as boolean) === true,
          message: (res.message as string) ?? '',
          data: seller,
        } as ApiResponse<AdminSeller>;
      })
    );
  }

  // Update seller status
  updateSellerStatus(id: string, status: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map((res) => {
        const s = res.data?.seller ?? res.data ?? null;
        if (!s) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminSeller>;
        const seller: AdminSeller = {
          _id: s._id ?? s.id,
          userId: s.userId?._id ?? s.userId,
          user: s.user
            ? {
                _id: s.user._id ?? s.user.id,
                firstName: s.user.firstName,
                lastName: s.user.lastName,
                email: s.user.email,
                role: s.user.role,
                isEmailConfirmed: s.user.isEmailConfirmed,
                avatarUrl: s.user.avatarUrl,
                createdAt: s.user.createdAt,
                updatedAt: s.user.updatedAt,
              }
            : undefined,
          storeName: s.storeName,
          status: s.status,
          totalEarnings: s.totalEarnings,
          logoUrl: s.logoUrl,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          isDeleted: s.isDeleted,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: seller,
        } as ApiResponse<AdminSeller>;
      })
    );
  }

  // Delete seller
  deleteSeller(id: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const s = res.data?.seller ?? res.data ?? null;
        if (!s) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminSeller>;
        const seller: AdminSeller = {
          _id: s._id ?? s.id,
          userId: s.userId?._id ?? s.userId,
          user: s.user
            ? {
                _id: s.user._id ?? s.user.id,
                firstName: s.user.firstName,
                lastName: s.user.lastName,
                email: s.user.email,
                role: s.user.role,
                isEmailConfirmed: s.user.isEmailConfirmed,
                avatarUrl: s.user.avatarUrl,
                createdAt: s.user.createdAt,
                updatedAt: s.user.updatedAt,
              }
            : undefined,
          storeName: s.storeName,
          status: s.status,
          totalEarnings: s.totalEarnings,
          logoUrl: s.logoUrl,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          isDeleted: s.isDeleted,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: seller,
        } as ApiResponse<AdminSeller>;
      })
    );
  }

  // Restore deleted seller
  restoreSeller(id: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/restore`, {}).pipe(
      map((res) => {
        const s = res.data?.seller ?? res.data ?? null;
        if (!s) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminSeller>;
        const seller: AdminSeller = {
          _id: s._id ?? s.id,
          userId: s.userId?._id ?? s.userId,
          user: s.user
            ? {
                _id: s.user._id ?? s.user.id,
                firstName: s.user.firstName,
                lastName: s.user.lastName,
                email: s.user.email,
                role: s.user.role,
                isEmailConfirmed: s.user.isEmailConfirmed,
                avatarUrl: s.user.avatarUrl,
                createdAt: s.user.createdAt,
                updatedAt: s.user.updatedAt,
              }
            : undefined,
          storeName: s.storeName,
          status: s.status,
          totalEarnings: s.totalEarnings,
          logoUrl: s.logoUrl,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          isDeleted: s.isDeleted,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: seller,
        } as ApiResponse<AdminSeller>;
      })
    );
  }
}
