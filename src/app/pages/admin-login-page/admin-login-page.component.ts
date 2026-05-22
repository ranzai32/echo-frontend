import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginPageComponent {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    const username = this.username.trim();
    const password = this.password;

    if (!username || !password) {
      this.error.set('Введите логин и пароль.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const token = await this.api.login(username, password);
      this.auth.setToken(token);
      await this.router.navigate(['/admin']);
    } catch {
      this.error.set('Неверный логин или пароль.');
    } finally {
      this.loading.set(false);
    }
  }
}
