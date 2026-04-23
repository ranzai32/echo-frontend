import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  readonly pseudonym = input.required<string>();
  readonly size = input(40);

  initials(): string {
    const text = this.pseudonym().trim();
    if (!text) {
      return 'AN';
    }

    const chunks = text.split(/\s+/).filter(Boolean);
    if (chunks.length === 1) {
      return chunks[0].slice(0, 2).toUpperCase();
    }

    return `${chunks[0][0]}${chunks[chunks.length - 1][0]}`.toUpperCase();
  }
}
