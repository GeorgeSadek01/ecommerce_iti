import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AdminPromoCode, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminPromoCodeService {
  private apiUrl = `${environment.apiBaseUrl}/admin/commerce/promo-codes`;

  constructor(private http: HttpClient) {}

  // Get all promo codes
  getPromoCodes(page: number = 1, limit: number = 10): Observable<ApiResponse<ListResponse<AdminPromoCode>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const promoCodes = res.data?.promoCodes ?? res.data?.items ?? [];
        const items: AdminPromoCode[] = (promoCodes || []).map((p: any) => ({
          _id: p._id ?? p.id,
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses ?? p.usageLimit,
          usesCount: p.usesCount,
          isActive: p.isActive,
          expiryDate: p.expiresAt ?? p.expiryDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));

        const pagination = res.data?.pagination ?? res.data?.meta ?? res.meta ?? {};
        const meta = {
          page: pagination.page ?? pagination.currentPage ?? 1,
          limit: pagination.limit ?? pagination.perPage ?? 10,
          total: pagination.total ?? 0,
          pages: pagination.totalPages ?? pagination.pages ?? 1,
        } as any;

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: { items, meta },
        } as ApiResponse<ListResponse<AdminPromoCode>>;
      })
    );
  }

  // Get single promo code
  getPromoCode(id: string): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const p = res.data?.promoCode ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminPromoCode>;

        const promo: AdminPromoCode = {
          _id: p._id ?? p.id,
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses ?? p.usageLimit,
          usesCount: p.usesCount,
          isActive: p.isActive,
          expiryDate: p.expiresAt ?? p.expiryDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: promo,
        } as ApiResponse<AdminPromoCode>;
      })
    );
  }

  // Create promo code
  createPromoCode(data: Partial<AdminPromoCode>): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res) => {
        const p = res.data?.promoCode ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminPromoCode>;
        const promo: AdminPromoCode = {
          _id: p._id ?? p.id,
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses ?? p.usageLimit,
          usesCount: p.usesCount,
          isActive: p.isActive,
          expiryDate: p.expiresAt ?? p.expiryDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: promo,
        } as ApiResponse<AdminPromoCode>;
      })
    );
  }

  // Update promo code
  updatePromoCode(id: string, data: Partial<AdminPromoCode>): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res) => {
        const p = res.data?.promoCode ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminPromoCode>;
        const promo: AdminPromoCode = {
          _id: p._id ?? p.id,
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses ?? p.usageLimit,
          usesCount: p.usesCount,
          isActive: p.isActive,
          expiryDate: p.expiresAt ?? p.expiryDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: promo,
        } as ApiResponse<AdminPromoCode>;
      })
    );
  }

  // Toggle promo code active status
  toggleActive(id: string): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle-active`, {}).pipe(
      map((res) => {
        const p = res.data?.promoCode ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminPromoCode>;
        const promo: AdminPromoCode = {
          _id: p._id ?? p.id,
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          maxUses: p.maxUses ?? p.usageLimit,
          usesCount: p.usesCount,
          isActive: p.isActive,
          expiryDate: p.expiresAt ?? p.expiryDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: promo,
        } as ApiResponse<AdminPromoCode>;
      })
    );
  }

  // Delete promo code
  deletePromoCode(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
