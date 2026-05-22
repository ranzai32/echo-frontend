import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { insertEmojiToken } from '../../core/emoji/emoji-text';
import { PostCreatePayload } from '../../core/models/post.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [FormsModule, AvatarComponent, EmojiPickerComponent, IconComponent],
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

  insertEmoji(token: string, textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart ?? this.content.length;
    const end = textarea.selectionEnd ?? start;
    const next = insertEmojiToken(this.content, token, start, end);
    this.content = next.value;

    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(next.caret, next.caret);
      this.resize(textarea);
    });
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
