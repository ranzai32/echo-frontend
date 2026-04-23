import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedStateService } from '../../core/services/feed-state.service';
import { SessionService } from '../../core/services/session.service';
import { PostItem, ReplyItem } from '../../core/models/post.model';
import { PostCardComponent } from '../../ui/post-card/post-card.component';

@Component({
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [PostCardComponent],
  templateUrl: './post-detail-page.component.html',
  styleUrl: './post-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostDetailPageComponent implements OnInit {
  readonly state = inject(FeedStateService);
  readonly session = inject(SessionService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly post = signal<PostItem | null>(null);
  readonly replies = signal<ReplyItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    await this.session.ensureSession();
    await this.load();
  }

  async load(): Promise<void> {
    const postID = this.route.snapshot.paramMap.get('id')?.trim();
    if (!postID) {
      this.error.set('Post not found.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const [post, replies] = await Promise.all([this.state.getPost(postID), this.state.fetchReplies(postID)]);
      this.post.set(post);
      this.replies.set(replies);
    } catch {
      this.error.set('Post not found.');
    } finally {
      this.loading.set(false);
    }
  }

  async onLike(): Promise<void> {
    const post = this.post();
    if (!post) {
      return;
    }

    await this.state.reactUpvote(post.id);
    await this.load();
  }

  async onReply(event: { postId: string; content: string }): Promise<void> {
    await this.state.createReply(event.postId, event.content);
    await this.load();
  }

  async onSubReply(event: { postId: string; parentReplyId: string; content: string }): Promise<void> {
    await this.state.createSubReply(event.postId, event.parentReplyId, event.content);
    await this.load();
  }

  async onUpdateReply(event: { replyId: string; content: string }): Promise<void> {
    const updated = await this.state.updateReply(event.replyId, event.content);
    const replies = await this.state.fetchReplies(updated.postId);
    this.replies.set(replies);
  }

  async onDeleteReply(event: { postId: string; replyId: string }): Promise<void> {
    await this.state.deleteReply(event.replyId);
    await this.load();
  }

  async onLikeReply(event: { postId: string; replyId: string }): Promise<void> {
    await this.state.reactReplyUpvote(event.replyId);
    await this.load();
  }

  async onDeletePost(postID: string): Promise<void> {
    await this.state.deletePost(postID);
    await this.router.navigate(['/']);
  }

  async onReportPost(event: { postId: string; reason: string }): Promise<void> {
    await this.state.reportPost(event.postId, event.reason);
  }

  back(): void {
    void this.router.navigate(['/']);
  }
}