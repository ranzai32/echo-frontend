import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostCreatePayload } from '../../core/models/post.model';
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
  readonly submitted = output<PostCreatePayload>();
  content = '';
  selectedFile?: File;

  resize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = '0';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  submit(): void {
    const trimmed = this.content.trim();
    if (!trimmed) {
      return;
    }

    this.submitted.emit({ content: trimmed, file: this.selectedFile });
    this.content = '';
    this.selectedFile = undefined;
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0];
    input.value = '';
  }

  removeFile(): void {
    this.selectedFile = undefined;
  }
}
