import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconButtonComponent {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly active = input(false);
  readonly clicked = output<void>();

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.clicked.emit();
  }
}
