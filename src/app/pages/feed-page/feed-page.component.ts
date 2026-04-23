import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { PostComposerComponent } from '../../ui/post-composer/post-composer.component';
import { PostCardComponent } from '../../ui/post-card/post-card.component';
import { SkeletonPostComponent } from '../../ui/skeleton-post/skeleton-post.component';
import { FeedStateService } from '../../core/services/feed-state.service';
import { SessionService } from '../../core/services/session.service';
import { ReplyItem } from '../../core/models/post.model';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [PostComposerComponent, PostCardComponent, SkeletonPostComponent],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sentinel', { static: true }) sentinelRef?: ElementRef<HTMLElement>;

  readonly state = inject(FeedStateService);
  readonly session = inject(SessionService);

  readonly loadingInitial = this.state.loadingInitial;
  readonly loadingMore = this.state.loadingMore;
  readonly posts = this.state.posts;
  readonly error = this.state.error;
  readonly likedPostIDs = this.state.likedPostIDs;
  readonly likedReplyIDs = this.state.likedReplyIDs;
  readonly repliesByPost = signal<Partial<Record<string, ReplyItem[]>>>({});

  private observer?: IntersectionObserver;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.state.init();
  }

  ngAfterViewInit(): void {
    if (!this.sentinelRef || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.loadingInitial() && !this.loadingMore()) {
          void this.state.loadMore();
        }
      },
      { rootMargin: '120px' }
    );

    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  async onCreate(content: string): Promise<void> {
    await this.state.createPost(content);
  }

  async onLike(postID: string): Promise<void> {
    await this.state.reactUpvote(postID);
  }

  async onReply(event: { postId: string; content: string }): Promise<void> {
    await this.state.createReply(event.postId, event.content);
    await this.onOpenReplies(event.postId);
  }

  async onOpenReplies(postID: string): Promise<void> {
    const replies = await this.state.fetchReplies(postID);
    this.repliesByPost.update((items) => ({ ...items, [postID]: replies }));
  }

  async onDeletePost(postID: string): Promise<void> {
    await this.state.deletePost(postID);
  }

  async onReportPost(event: { postId: string; reason: string }): Promise<void> {
    await this.state.reportPost(event.postId, event.reason);
  }

  async onSubReply(event: { postId: string; parentReplyId: string; content: string }): Promise<void> {
    await this.state.createSubReply(event.postId, event.parentReplyId, event.content);
    await this.onOpenReplies(event.postId);
  }

  async onUpdateReply(event: { replyId: string; content: string }): Promise<void> {
    const updated = await this.state.updateReply(event.replyId, event.content);
    await this.onOpenReplies(updated.postId);
  }

  async onDeleteReply(event: { postId: string; replyId: string }): Promise<void> {
    await this.state.deleteReply(event.replyId);
    await this.onOpenReplies(event.postId);
  }

  async onLikeReply(event: { postId: string; replyId: string }): Promise<void> {
    await this.state.reactReplyUpvote(event.replyId);
    this.repliesByPost.update((items) => {
      const next = [...(items[event.postId] ?? [])].map((reply) =>
        reply.id === event.replyId ? { ...reply, score: reply.score + 1 } : reply
      );
      return { ...items, [event.postId]: next };
    });
  }

  openPost(postID: string): void {
    void this.router.navigate(['/post', postID]);
  }
}
