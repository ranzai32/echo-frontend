import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent {
  readonly dark = input(false);
  readonly darkToggle = output<void>();

  toggleTheme(): void {
    this.darkToggle.emit();
  }
}
