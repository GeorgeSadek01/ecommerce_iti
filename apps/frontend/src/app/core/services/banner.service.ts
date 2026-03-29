import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';

export interface PublicBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly base = `${environment.apiBaseUrl}/banners`;

  constructor(private readonly http: HttpClient) {}

  getBanners(limit = 10): Observable<PublicBanner[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<ApiResponse<{ banners: PublicBanner[] }>>(this.base, { params }).pipe(
      map((res) => {
        const banners = res.data?.banners ?? [];

        return banners.map((banner) => ({
          id: banner.id,
          title: banner.title,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl ?? null,
          sortOrder: banner.sortOrder,
          isActive: banner.isActive,
          startsAt: banner.startsAt,
          endsAt: banner.endsAt,
        }));
      })
    );
  }
}
