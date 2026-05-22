import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  FeedLatestResponse,
  FeedTrendingResponse,
  PostCreatePayload,
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

interface SharePostResponse {
  url: string;
  postId: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  register(): Promise<AuthRegisterResponse> {
    return firstValueFrom(this.http.post<AuthRegisterResponse>(`${this.apiBaseUrl}/auth/register`, {}));
  }

  refresh(token: string): Promise<AuthRefreshResponse> {
    return firstValueFrom(
      this.http.post<AuthRefreshResponse>(`${this.apiBaseUrl}/auth/refresh`, {}, { headers: this.authHeaders(token) })
    );
  }

  latest(limit: number, cursor = ''): Promise<FeedLatestResponse> {
    let params = new HttpParams().set('limit', String(limit));
    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return firstValueFrom(this.http.get<FeedLatestResponse>(`${this.apiBaseUrl}/feed/latest`, { params }));
  }

  trending(limit: number): Promise<FeedTrendingResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return firstValueFrom(this.http.get<FeedTrendingResponse>(`${this.apiBaseUrl}/feed/trending`, { params }));
  }

  createPost(token: string, payload: PostCreatePayload): Promise<PostItem> {
    if (payload.file) {
      const body = new FormData();
      body.append('content', payload.content);
      body.append('file', payload.file);

      return firstValueFrom(
        this.http.post<PostItem>(`${this.apiBaseUrl}/posts`, body, { headers: this.authHeaders(token) })
      );
    }

    return firstValueFrom(
      this.http.post<PostItem>(`${this.apiBaseUrl}/posts`, { content: payload.content }, { headers: this.authHeaders(token) })
    );
  }

  attachmentUrl(id: string): string {
    return `${this.apiBaseUrl}/posts/attachments/${id}`;
  }

  getPost(id: string): Promise<PostItem> {
    return firstValueFrom(this.http.get<PostItem>(`${this.apiBaseUrl}/posts/${id}`));
  }

  getShareUrl(postId: string): Promise<string> {
    return firstValueFrom(this.http.get<SharePostResponse>(`${this.apiBaseUrl}/posts/${postId}/share`)).then(
      (response) => response.url
    );
  }

  searchPosts(query: string, limit = 20): Promise<SearchPostsResponse> {
    return firstValueFrom(this.http.post<SearchPostsResponse>(`${this.apiBaseUrl}/posts/search`, { query, limit }));
  }

  deletePost(token: string, id: string): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.delete<{ ok: boolean }>(`${this.apiBaseUrl}/posts/${id}`, { headers: this.authHeaders(token) })
    );
  }

  react(token: string, postId: string, kind: ReactionKind): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(
        `${this.apiBaseUrl}/posts/${postId}/react`,
        { kind },
        { headers: this.authHeaders(token) }
      )
    );
  }

  listReplies(postId: string, limit = 20): Promise<RepliesResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return firstValueFrom(this.http.get<RepliesResponse>(`${this.apiBaseUrl}/posts/${postId}/replies`, { params }));
  }

  createReply(token: string, postId: string, content: string): Promise<ReplyItem> {
    return firstValueFrom(
      this.http.post<ReplyItem>(
        `${this.apiBaseUrl}/posts/${postId}/replies`,
        { content },
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

  reportPost(token: string, postId: string, reason: string): Promise<{ ok: boolean; auto_hidden: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean; auto_hidden: boolean }>(
        `${this.apiBaseUrl}/posts/${postId}/report`,
        { reason },
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
