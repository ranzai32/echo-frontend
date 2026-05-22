import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  toggleTheme(): void {
    this.theme.toggle();
  }
}
