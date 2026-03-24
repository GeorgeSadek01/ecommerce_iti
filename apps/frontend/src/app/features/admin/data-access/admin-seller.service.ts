import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminSeller, ApiResponse, ListResponse } from './admin.types';

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
      params = params.set('query', query);
    }

    return this.http.get<ApiResponse<ListResponse<AdminSeller>>>(this.apiUrl, { params });
  }

  // Get single seller
  getSeller(id: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.get<ApiResponse<AdminSeller>>(`${this.apiUrl}/${id}`);
  }

  // Update seller status
  updateSellerStatus(id: string, status: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.patch<ApiResponse<AdminSeller>>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Delete seller
  deleteSeller(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Restore deleted seller
  restoreSeller(id: string): Observable<ApiResponse<AdminSeller>> {
    return this.http.patch<ApiResponse<AdminSeller>>(`${this.apiUrl}/${id}/restore`, {});
  }
}
