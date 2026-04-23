import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-post',
  standalone: true,
  templateUrl: './skeleton-post.component.html',
  styleUrl: './skeleton-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonPostComponent {}
