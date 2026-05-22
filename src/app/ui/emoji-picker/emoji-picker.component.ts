import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { EMOJI_CODES } from '../../core/emoji/emoji-codes';
import { EmojiService } from '../../core/services/emoji.service';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmojiPickerComponent {
  private readonly emoji = inject(EmojiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly label = input('Insert emoji');
  readonly picked = output<string>();

  readonly open = signal(false);
  readonly codes = EMOJI_CODES;

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  pick(code: string): void {
    this.picked.emit(this.emoji.token(code));
    this.close();
  }

  url(code: string): string {
    return this.emoji.assetUrl(code);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }

    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) {
      return;
    }

    this.close();
  }
}
