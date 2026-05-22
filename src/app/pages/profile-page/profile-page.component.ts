import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../ui/avatar/avatar.component';
import { PostCardComponent } from '../../ui/post-card/post-card.component';
import { FeedTab } from '../../core/models/post.model';
import { SessionService } from '../../core/services/session.service';
import { FeedStateService } from '../../core/services/feed-state.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [AvatarComponent, PostCardComponent, DatePipe],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent implements OnInit {
  readonly session = inject(SessionService);
  readonly state = inject(FeedStateService);

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    void this.session.ensureSession();
  }

  readonly pseudonym = this.session.pseudonym;
  readonly activeTab = signal<FeedTab>('posts');
  readonly myPosts = computed(() =>
    this.state.posts().filter((post) => post.pseudonym === this.session.pseudonym())
  );
  readonly myReplies = this.state.myReplies;
  readonly karma = computed(() => this.myPosts().reduce((sum, post) => sum + post.score, 0));

  selectTab(tab: FeedTab): void {
    this.activeTab.set(tab);
  }

  openPost(postID: string): void {
    void this.router.navigate(['/post', postID]);
  }

  async onLike(postID: string): Promise<void> {
    await this.state.togglePostLike(postID);
  }

  async onPostDeleted(postID: string): Promise<void> {
    await this.state.deletePost(postID);
  }
}
