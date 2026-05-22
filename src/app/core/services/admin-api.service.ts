import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminReport, AdminReportsResponse, ModerationAction } from '../models/admin.model';

interface AdminLoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Promise<string> {
    return firstValueFrom(
      this.http.post<AdminLoginResponse>(`${this.apiBaseUrl}/auth/admin/login`, { username, password })
    ).then((response) => response.token);
  }

  listReports(token: string, limit = 50, offset = 0): Promise<AdminReport[]> {
    return firstValueFrom(
      this.http.post<AdminReportsResponse>(
        `${this.apiBaseUrl}/admin/reports/list`,
        { limit, offset },
        { headers: this.authHeaders(token) }
      )
    ).then((response) => response.reports ?? []);
  }

  moderate(token: string, reportId: string, action: ModerationAction, note = ''): Promise<void> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(
        `${this.apiBaseUrl}/admin/reports/action`,
        { reportId, action, note },
        { headers: this.authHeaders(token) }
      )
    ).then(() => undefined);
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
