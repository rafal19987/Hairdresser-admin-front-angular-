import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@/environments/environment';
import {ApiResponse, CountedAndPaginatedList} from '@/app/shared/interface/response/response.types';
import {AuditLogEntry, AuditLogFilters} from '@/app/core/audit-log/audit-log.types';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly _httpClient = inject(HttpClient);

  public getList(
    page: number = 0,
    limit: number = 20,
    filters: AuditLogFilters = {},
  ): Observable<CountedAndPaginatedList<AuditLogEntry>> {
    let params = new HttpParams().set('page', page + 1).set('limit', limit);

    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }

    return this._httpClient.get<CountedAndPaginatedList<AuditLogEntry>>(
      environment.API_URL + '/api/audit-logs',
      {params},
    );
  }

  public getById(uuid: string): Observable<ApiResponse> {
    return this._httpClient.get<ApiResponse>(
      environment.API_URL + `/api/audit-logs/${uuid}`,
    );
  }
}
