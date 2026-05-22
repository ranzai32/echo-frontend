import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';
import { EmojiCode } from '../emoji/emoji-codes';
import { emojiToken } from '../emoji/emoji-text';

@Injectable({ providedIn: 'root' })
export class EmojiService {
  constructor(private readonly theme: ThemeService) {}

  skin(): 'light' | 'dark' {
    return this.theme.dark() ? 'dark' : 'light';
  }

  assetUrl(code: EmojiCode | string): string {
    return `/emojis/${this.skin()}/${code}.gif`;
  }

  token(code: EmojiCode | string): string {
    return emojiToken(code);
  }
}
