import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { PostCreatePayload, PostItem, ReplyItem } from '../models/post.model';

const SEEDED_KEY = 'echo.seeded';

@Injectable({ providedIn: 'root' })
export class FeedStateService {
  readonly posts = signal<PostItem[]>([]);
  readonly myReplies = signal<ReplyItem[]>([]);
  readonly likedPostIDs = signal<Set<string>>(new Set<string>());
  readonly likedReplyIDs = signal<Set<string>>(new Set<string>());
  readonly loadingInitial = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');

  private cursor = '';
  private ws?: WebSocket;

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService
  ) {}

  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      this.loadingInitial.set(false);
      return;
    }

    if (!this.loadingInitial()) {
      return;
    }

    try {
      await this.session.ensureSession();
      await this.loadLatest(true);

      if (this.posts().length === 0) {
        await this.seedTestData();
        await this.loadLatest(true);
      }

      this.connectWs();
    } catch {
      this.error.set('Unable to load feed.');
    } finally {
      this.loadingInitial.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (this.loadingMore() || !this.cursor) {
      return;
    }

    this.loadingMore.set(true);
    try {
      const data = await this.api.latest(10, this.cursor, this.session.token());
      this.posts.update((prev) => [...prev, ...data.posts]);
      this.syncLikedPostsFromItems(data.posts);
      this.cursor = data.next_cursor;
    } finally {
      this.loadingMore.set(false);
    }
  }

  async createPost(payload: PostCreatePayload): Promise<void> {
    const trimmed = payload.content.trim();
    if (!trimmed) {
      return;
    }

    const created = await this.api.createPost(this.session.token(), { content: trimmed, file: payload.file });
    this.prependUnique(created);
  }

  async deletePost(postId: string): Promise<void> {
    await this.api.deletePost(this.session.token(), postId);
    this.posts.update((items) => items.filter((item) => item.id !== postId));
  }

  async reportPost(postId: string, reason: string): Promise<void> {
    await this.api.reportPost(this.session.token(), postId, reason);
  }

  async togglePostLike(postId: string): Promise<void> {
    const liked = this.likedPostIDs().has(postId);

    try {
      if (liked) {
        await this.api.unreactPost(this.session.token(), postId);
        this.setPostLiked(postId, false);
      } else {
        await this.api.react(this.session.token(), postId, 'upvote');
        this.setPostLiked(postId, true);
      }
    } catch (error) {
      if (!liked && error instanceof HttpErrorResponse && error.status === 409) {
        this.setPostLiked(postId, true);
        return;
      }

      if (liked) {
        try {
          await this.api.react(this.session.token(), postId, 'upvote');
          this.setPostLiked(postId, false);
          return;
        } catch (retryError) {
          if (retryError instanceof HttpErrorResponse && retryError.status === 409) {
            this.setPostLiked(postId, false);
            return;
          }
        }
      }

      throw error;
    }
  }

  async createReply(postId: string, content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    const created = await this.api.createReply(this.session.token(), postId, trimmed);
    this.myReplies.update((items) => [created, ...items]);
    this.posts.update((items) => items.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p)));
  }

  async createSubReply(postId: string, parentReplyId: string, content: string): Promise<ReplyItem> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('empty content');
    }

    const created = await this.api.createSubReply(this.session.token(), postId, parentReplyId, trimmed);
    this.myReplies.update((items) => [created, ...items]);
    this.posts.update((items) => items.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p)));
    return created;
  }

  async updateReply(replyId: string, content: string): Promise<ReplyItem> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('empty content');
    }

    const updated = await this.api.updateReply(this.session.token(), replyId, trimmed);
    this.myReplies.update((items) => items.map((item) => (item.id === replyId ? updated : item)));
    return updated;
  }

  async deleteReply(replyId: string): Promise<void> {
    await this.api.deleteReply(this.session.token(), replyId);
    this.myReplies.update((items) => items.filter((item) => item.id !== replyId));
  }

  async refreshPost(postId: string): Promise<void> {
    const post = await this.getPost(postId);
    this.posts.update((items) => items.map((item) => (item.id === postId ? post : item)));
  }

  async toggleReplyLike(replyId: string): Promise<void> {
    const liked = this.likedReplyIDs().has(replyId);

    try {
      if (liked) {
        await this.api.unreactReply(this.session.token(), replyId);
        this.setReplyLiked(replyId, false);
        return;
      }

      await this.api.reactReply(this.session.token(), replyId, 'upvote');
      this.setReplyLiked(replyId, true);
    } catch (error) {
      if (!liked && error instanceof HttpErrorResponse && error.status === 409) {
        this.setReplyLiked(replyId, true);
        return;
      }

      if (liked) {
        try {
          await this.api.reactReply(this.session.token(), replyId, 'upvote');
          this.setReplyLiked(replyId, false);
          return;
        } catch (retryError) {
          if (retryError instanceof HttpErrorResponse && retryError.status === 409) {
            this.setReplyLiked(replyId, false);
            return;
          }
        }
      }

      throw error;
    }
  }

  async search(query: string, limit = 20): Promise<PostItem[]> {
    const data = await this.api.searchPosts(query, limit);
    return data.posts;
  }

  async trending(limit = 20): Promise<PostItem[]> {
    const data = await this.api.trending(limit);
    return data.posts;
  }

  async getPost(postId: string): Promise<PostItem> {
    const post = await this.api.getPost(postId, this.session.token());
    this.syncLikedPostsFromItems([post]);
    return post;
  }

  async fetchReplies(postId: string): Promise<ReplyItem[]> {
    const data = await this.api.listReplies(postId, 100, this.session.token());
    const replies = this.buildReplyTree(data.replies);
    this.syncLikedRepliesFromItems(replies);
    return replies;
  }

  bumpReplyScoreInTree(replies: ReplyItem[], replyId: string, delta: number): ReplyItem[] {
    return replies.map((reply) => {
      const children = reply.children?.length ? this.bumpReplyScoreInTree(reply.children, replyId, delta) : reply.children;
      if (reply.id === replyId) {
        return { ...reply, score: Math.max(0, reply.score + delta), children };
      }

      if (children !== reply.children) {
        return { ...reply, children };
      }

      return reply;
    });
  }

  private buildReplyTree(replies: ReplyItem[]): ReplyItem[] {
    if (replies.length === 0) {
      return replies;
    }

    if (replies.some((reply) => (reply.children?.length ?? 0) > 0)) {
      return replies;
    }

    const nodes = new Map<string, ReplyItem>();
    for (const reply of replies) {
      nodes.set(reply.id, { ...reply, children: [] });
    }

    const roots: ReplyItem[] = [];
    for (const reply of replies) {
      const node = nodes.get(reply.id)!;
      if (reply.parentReplyId && nodes.has(reply.parentReplyId)) {
        nodes.get(reply.parentReplyId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async loadLatest(reset: boolean): Promise<void> {
    const data = await this.api.latest(10, '', this.session.token());
    if (reset) {
      this.posts.set(data.posts);
    } else {
      this.posts.update((prev) => [...prev, ...data.posts]);
    }

    this.syncLikedPostsFromItems(data.posts);
    this.cursor = data.next_cursor;
  }

  private connectWs(): void {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined' || this.ws) {
      return;
    }

    this.ws = new WebSocket(this.api.toWsFeedUrl());
    this.ws.onmessage = (event) => {
      try {
        const post = JSON.parse(event.data) as PostItem;
        this.prependUnique(post);
      } catch {
        return;
      }
    };

    this.ws.onclose = () => {
      this.ws = undefined;
      setTimeout(() => this.connectWs(), 1500);
    };
  }

  private setPostLiked(postId: string, liked: boolean): void {
    this.posts.update((items) =>
      items.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const delta = liked ? 1 : -1;
        return { ...post, score: Math.max(0, post.score + delta) };
      })
    );

    this.likedPostIDs.update((prev) => {
      const next = new Set(prev);
      if (liked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }

      return next;
    });
  }

  private setReplyLiked(replyId: string, liked: boolean): void {
    this.likedReplyIDs.update((prev) => {
      const next = new Set(prev);
      if (liked) {
        next.add(replyId);
      } else {
        next.delete(replyId);
      }

      return next;
    });
  }

  private syncLikedPostsFromItems(posts: PostItem[]): void {
    this.likedPostIDs.update((prev) => {
      const next = new Set(prev);
      for (const post of posts) {
        if (post.likedByMe) {
          next.add(post.id);
        } else if (post.likedByMe === false) {
          next.delete(post.id);
        }
      }

      return next;
    });
  }

  private syncLikedRepliesFromItems(replies: ReplyItem[]): void {
    const walk = (items: ReplyItem[]): void => {
      for (const reply of items) {
        this.likedReplyIDs.update((prev) => {
          const next = new Set(prev);
          if (reply.likedByMe) {
            next.add(reply.id);
          } else if (reply.likedByMe === false) {
            next.delete(reply.id);
          }

          return next;
        });

        if (reply.children?.length) {
          walk(reply.children);
        }
      }
    };

    walk(replies);
  }

  private prependUnique(post: PostItem): void {
    this.posts.update((items) => {
      if (items.some((item) => item.id === post.id)) {
        return items;
      }

      return [post, ...items];
    });
  }

  private async seedTestData(): Promise<void> {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SEEDED_KEY) === '1') {
      return;
    }

    const contents = [
      'anonymous thought: less noise, more signal.',
      'building in public without profile photos feels liberating.',
      'this post was created from endpoint seed flow.',
      'websocket live updates should push this into feed instantly.'
    ];

    for (const content of contents) {
      const auth = await this.api.register();
      await this.api.createPost(auth.token, { content });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SEEDED_KEY, '1');
    }
  }
}
