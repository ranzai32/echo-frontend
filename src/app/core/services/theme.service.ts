import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(false);

  toggle(): void {
    this.dark.update((value) => !value);
  }
}
