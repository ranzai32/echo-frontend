import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

export type IconName =
  | 'home'
  | 'search'
  | 'plus'
  | 'trash'
  | 'pencil'
  | 'flag'
  | 'activity'
  | 'profile'
  | 'heart'
  | 'reply'
  | 'repost'
  | 'attach'
  | 'send'
  | 'moon'
  | 'sun';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
