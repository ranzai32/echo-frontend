import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminReport, ModerationAction } from '../../core/models/admin.model';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly reports = signal<AdminReport[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actingId = signal('');
  readonly appBaseUrl = environment.appBaseUrl;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const items = await this.api.listReports(this.auth.token());
      this.reports.set(items);
    } catch {
      this.error.set('Не удалось загрузить жалобы. Попробуйте войти снова.');
      this.auth.logout();
      await this.router.navigate(['/admin/login']);
    } finally {
      this.loading.set(false);
    }
  }

  postUrl(postId: string): string {
    return `${this.appBaseUrl}/post/${postId}`;
  }

  async act(report: AdminReport, action: ModerationAction): Promise<void> {
    if (this.actingId()) {
      return;
    }

    const note =
      action === 'ban'
        ? 'Banned by moderator'
        : action === 'hide'
          ? 'Hidden by moderator'
          : 'Dismissed by moderator';

    this.actingId.set(report.id);

    try {
      await this.api.moderate(this.auth.token(), report.id, action, note);
      this.reports.update((items) => items.filter((item) => item.id !== report.id));
    } catch {
      this.error.set('Не удалось выполнить действие.');
    } finally {
      this.actingId.set('');
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }
}
