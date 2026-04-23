import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [FormsModule, AvatarComponent, IconComponent],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostComposerComponent {
  readonly pseudonym = input('anonymous');
  readonly submitted = output<string>();
  content = '';

  resize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = '0';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  submit(): void {
    const trimmed = this.content.trim();
    if (!trimmed) {
      return;
    }

    this.submitted.emit(trimmed);
    this.content = '';
  }
}
