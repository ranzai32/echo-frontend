import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { TopBarComponent } from './layout/top-bar/top-bar.component';
import { BottomNavComponent } from './layout/bottom-nav/bottom-nav.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, BottomNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly title = 'echo-frontend';
  readonly theme = inject(ThemeService);
  readonly dark = this.theme.dark;
  private readonly router = inject(Router);

  readonly hideChrome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/admin')),
      startWith(this.router.url.startsWith('/admin'))
    ),
    { initialValue: false }
  );

  toggleTheme(): void {
    this.theme.toggle();
  }
}
