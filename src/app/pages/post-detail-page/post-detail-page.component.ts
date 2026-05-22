import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
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

  constructor() {
    effect(() => {
      const event = this.state.realtimeEvent();
      const post = this.post();
      if (!event || !post) {
        return;
      }

      switch (event.type) {
        case 'post.updated':
          if (event.postId === post.id) {
            this.post.set({ ...post, score: event.score, replyCount: event.replyCount });
          }
          break;
        case 'post.deleted':
        case 'post.hidden':
          if (event.postId === post.id) {
            void this.router.navigate(['/']);
          }
          break;
        case 'reply.created':
          if (event.reply.postId === post.id) {
            this.replies.update((items) => this.state.mergeReplyIntoTree(items, event.reply));
            this.post.set({ ...post, replyCount: post.replyCount + 1 });
          }
          break;
        case 'reply.updated':
          if (event.reply.postId === post.id) {
            this.replies.update((items) => this.state.patchReplyInTree(items, event.reply));
          }
          break;
        case 'reply.deleted':
          if (event.postId === post.id) {
            this.replies.update((items) => this.state.removeReplyFromTree(items, event.replyId));
            this.post.set({ ...post, replyCount: Math.max(0, post.replyCount - 1) });
          }
          break;
      }
    });
  }

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

    await this.state.togglePostLike(post.id);
    const liked = this.state.likedPostIDs().has(post.id);
    this.post.set({ ...post, likedByMe: liked });
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
    const wasLiked = this.state.likedReplyIDs().has(event.replyId);
    await this.state.toggleReplyLike(event.replyId);
    const delta = wasLiked ? -1 : 1;
    this.replies.update((items) => this.state.bumpReplyScoreInTree(items, event.replyId, delta));
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