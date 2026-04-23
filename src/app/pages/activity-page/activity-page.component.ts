import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../ui/icon/icon.component';
import { PostCardComponent } from '../../ui/post-card/post-card.component';
import { FeedStateService } from '../../core/services/feed-state.service';
import { SessionService } from '../../core/services/session.service';
import { PostItem } from '../../core/models/post.model';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [IconComponent, PostCardComponent],
  templateUrl: './activity-page.component.html',
  styleUrl: './activity-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityPageComponent implements OnInit {
  readonly state = inject(FeedStateService);
  readonly session = inject(SessionService);

  readonly posts = signal<PostItem[]>([]);
  readonly loading = signal(true);

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.session.ensureSession();
    const items = await this.state.trending(20);
    this.posts.set(items);
    this.loading.set(false);
  }

  openPost(postID: string): void {
    void this.router.navigate(['/post', postID]);
  }
}
