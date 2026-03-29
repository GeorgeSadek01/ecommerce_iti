import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AdminCategory, ApiResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/categories`;

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<ApiResponse<{ categories: AdminCategory[] }>> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        const categories = (res.data?.categories ?? res.data ?? []).map((category: any) => this.mapCategory(category));
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: { categories },
        } as ApiResponse<{ categories: AdminCategory[] }>;
      })
    );
  }

  createCategory(payload: {
    name: string;
    description?: string;
    parentId?: string | null;
  }): Observable<ApiResponse<{ category: AdminCategory }>> {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((res) => {
        const category = this.mapCategory(res.data?.category ?? res.data);
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: { category },
        } as ApiResponse<{ category: AdminCategory }>;
      })
    );
  }

  private mapCategory(category: any): AdminCategory {
    const parent = category.parentId;
    return {
      _id: category._id ?? category.id,
      name: category.name ?? '',
      slug: category.slug ?? '',
      parentId: parent?._id ?? parent ?? null,
      parentName: parent?.name ?? null,
      isActive: category.isActive,
    };
  }
}
