import { NgStyle } from '@angular/common';
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

const PANEL_WIDTH = 320;
const PANEL_MAX_HEIGHT = 260;
const VIEWPORT_GAP = 12;

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [NgStyle],
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
  readonly panelStyle = signal<Record<string, string>>({});
  readonly codes = EMOJI_CODES;

  toggle(): void {
    const willOpen = !this.open();
    this.open.set(willOpen);

    if (willOpen) {
      queueMicrotask(() => this.updatePanelPosition());
    }
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

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.open()) {
      this.updatePanelPosition();
    }
  }

  private updatePanelPosition(): void {
    const trigger = this.host.nativeElement.querySelector('.emoji-trigger') as HTMLElement | null;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
    const spaceAbove = rect.top - VIEWPORT_GAP;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const openBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
    const maxHeight = Math.round(Math.max(120, Math.min(PANEL_MAX_HEIGHT, openBelow ? spaceBelow - 8 : spaceAbove - 8)));

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_GAP) {
      left = window.innerWidth - width - VIEWPORT_GAP;
    }
    left = Math.max(VIEWPORT_GAP, left);

    if (openBelow) {
      const top = Math.min(rect.bottom + 8, window.innerHeight - maxHeight - VIEWPORT_GAP);
      this.panelStyle.set({
        top: `${Math.round(Math.max(VIEWPORT_GAP, top))}px`,
        left: `${Math.round(left)}px`,
        width: `${Math.round(width)}px`,
        maxHeight: `${maxHeight}px`,
        bottom: 'auto'
      });
      return;
    }

    this.panelStyle.set({
      top: 'auto',
      bottom: `${Math.round(window.innerHeight - rect.top + 8)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(width)}px`,
      maxHeight: `${maxHeight}px`
    });
  }
}
