import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvatarComponent } from '../../ui/avatar/avatar.component';
import { PostCardComponent } from '../../ui/post-card/post-card.component';
import { FeedTab } from '../../core/models/post.model';
import { SessionService } from '../../core/services/session.service';
import { FeedStateService } from '../../core/services/feed-state.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [AvatarComponent, PostCardComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  private readonly session = inject(SessionService);
  private readonly state = inject(FeedStateService);

  readonly pseudonym = this.session.pseudonym;
  readonly activeTab = signal<FeedTab>('posts');
  readonly myPosts = computed(() =>
    this.state.posts().filter((post) => post.pseudonym === this.session.pseudonym())
  );
  readonly myReplies = this.state.myReplies;
  readonly karma = computed(() => this.myPosts().reduce((sum, post) => sum + post.score, 0));

  constructor() {
    void this.session.ensureSession();
  }

  selectTab(tab: FeedTab): void {
    this.activeTab.set(tab);
  }
}
