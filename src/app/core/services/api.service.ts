import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  FeedLatestResponse,
  FeedTrendingResponse,
  PostItem,
  ReactionKind,
  SearchPostsResponse,
  RepliesResponse,
  ReplyItem
} from '../models/post.model';
import { environment } from '../../../environments/environment';

interface AuthRegisterResponse {
  token: string;
  pseudonym: string;
}

interface AuthRefreshResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  register(): Promise<AuthRegisterResponse> {
    return firstValueFrom(this.http.post<AuthRegisterResponse>(`${this.apiBaseUrl}/auth/register`, {}));
  }

  refresh(token: string): Promise<AuthRefreshResponse> {
    return firstValueFrom(this.http.post<AuthRefreshResponse>(`${this.apiBaseUrl}/auth/refresh`, { token }));
  }

  latest(limit: number, cursor = ''): Promise<FeedLatestResponse> {
    return firstValueFrom(
      this.http.post<FeedLatestResponse>(`${this.apiBaseUrl}/feed/latest`, {
        limit,
        cursor
      })
    );
  }

  trending(limit: number): Promise<FeedTrendingResponse> {
    return firstValueFrom(this.http.post<FeedTrendingResponse>(`${this.apiBaseUrl}/feed/trending`, { limit }));
  }

  createPost(token: string, content: string): Promise<PostItem> {
    return firstValueFrom(
      this.http.post<PostItem>(`${this.apiBaseUrl}/posts`, { content }, { headers: this.authHeaders(token) })
    );
  }

  getPost(id: string): Promise<PostItem> {
    return firstValueFrom(this.http.post<PostItem>(`${this.apiBaseUrl}/posts/get`, { id }));
  }

  searchPosts(query: string, limit = 20): Promise<SearchPostsResponse> {
    return firstValueFrom(this.http.post<SearchPostsResponse>(`${this.apiBaseUrl}/posts/search`, { query, limit }));
  }

  deletePost(token: string, id: string): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.apiBaseUrl}/posts/delete`, { id }, { headers: this.authHeaders(token) })
    );
  }

  react(token: string, postId: string, kind: ReactionKind): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.apiBaseUrl}/posts/react`, { postId, kind }, { headers: this.authHeaders(token) })
    );
  }

  listReplies(postId: string, limit = 20): Promise<RepliesResponse> {
    return firstValueFrom(
      this.http.post<RepliesResponse>(`${this.apiBaseUrl}/posts/replies/list`, { postId, limit })
    );
  }

  createReply(token: string, postId: string, content: string): Promise<ReplyItem> {
    return firstValueFrom(
      this.http.post<ReplyItem>(
        `${this.apiBaseUrl}/posts/replies/create`,
        { postId, content },
        { headers: this.authHeaders(token) }
      )
    );
  }

  createSubReply(token: string, postId: string, parentReplyId: string, content: string): Promise<ReplyItem> {
    return firstValueFrom(
      this.http.post<ReplyItem>(
        `${this.apiBaseUrl}/posts/replies/create`,
        { postId, parentReplyId, content },
        { headers: this.authHeaders(token) }
      )
    );
  }

  updateReply(token: string, replyId: string, content: string): Promise<ReplyItem> {
    return firstValueFrom(
      this.http.post<ReplyItem>(
        `${this.apiBaseUrl}/posts/replies/update`,
        { replyId, content },
        { headers: this.authHeaders(token) }
      )
    );
  }

  deleteReply(token: string, replyId: string): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(
        `${this.apiBaseUrl}/posts/replies/delete`,
        { replyId },
        { headers: this.authHeaders(token) }
      )
    );
  }

  reactReply(token: string, replyId: string, kind: ReactionKind): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(
        `${this.apiBaseUrl}/posts/replies/react`,
        { replyId, kind },
        { headers: this.authHeaders(token) }
      )
    );
  }

  reportPost(token: string, postId: string, reason: string): Promise<{ ok: boolean; autoHidden: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean; autoHidden: boolean }>(
        `${this.apiBaseUrl}/posts/report`,
        { postId, reason },
        { headers: this.authHeaders(token) }
      )
    );
  }

  toWsFeedUrl(): string {
    if (this.apiBaseUrl.startsWith('https://')) {
      return `${this.apiBaseUrl.replace('https://', 'wss://')}/ws/feed`;
    }

    return `${this.apiBaseUrl.replace('http://', 'ws://')}/ws/feed`;
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
