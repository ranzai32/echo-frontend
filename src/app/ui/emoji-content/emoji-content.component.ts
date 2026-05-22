import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { parseEmojiContent } from '../../core/emoji/emoji-text';
import { EmojiService } from '../../core/services/emoji.service';

@Component({
  selector: 'app-emoji-content',
  standalone: true,
  templateUrl: './emoji-content.component.html',
  styleUrl: './emoji-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmojiContentComponent {
  private readonly emoji = inject(EmojiService);

  readonly text = input.required<string>();

  parts() {
    return parseEmojiContent(this.text());
  }

  url(code: string): string {
    return this.emoji.assetUrl(code);
  }
}
