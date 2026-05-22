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
      const data = await this.api.latest(10, this.cursor);
      this.posts.update((prev) => [...prev, ...data.posts]);
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

  async reactUpvote(postId: string): Promise<void> {
    if (this.likedPostIDs().has(postId)) {
      return;
    }

    try {
      await this.api.react(this.session.token(), postId, 'upvote');
      this.posts.update((items) => items.map((p) => (p.id === postId ? { ...p, score: p.score + 1 } : p)));
      this.likedPostIDs.update((prev) => new Set(prev).add(postId));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.likedPostIDs.update((prev) => new Set(prev).add(postId));
        return;
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

    return this.api.createSubReply(this.session.token(), postId, parentReplyId, trimmed);
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

  async reactReplyUpvote(replyId: string): Promise<void> {
    if (this.likedReplyIDs().has(replyId)) {
      return;
    }

    try {
      await this.api.reactReply(this.session.token(), replyId, 'upvote');
      this.likedReplyIDs.update((prev) => new Set(prev).add(replyId));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.likedReplyIDs.update((prev) => new Set(prev).add(replyId));
        return;
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
    return this.api.getPost(postId);
  }

  async fetchReplies(postId: string): Promise<ReplyItem[]> {
    const data = await this.api.listReplies(postId, 20);
    return data.replies;
  }

  private async loadLatest(reset: boolean): Promise<void> {
    const data = await this.api.latest(10);
    if (reset) {
      this.posts.set(data.posts);
    } else {
      this.posts.update((prev) => [...prev, ...data.posts]);
    }

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
