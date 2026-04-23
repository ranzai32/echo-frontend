export type FeedTab = 'posts' | 'replies';

export type ReactionKind = 'upvote' | 'downvote';

export interface PostItem {
  id: string;
  authorId: string;
  pseudonym: string;
  content: string;
  replyCount: number;
  score: number;
  createdAt: string;
}

export interface ReplyItem {
  id: string;
  postId: string;
  parentReplyId?: string;
  authorId: string;
  pseudonym: string;
  content: string;
  score: number;
  createdAt: string;
}

export interface FeedLatestResponse {
  posts: PostItem[];
  next_cursor: string;
}

export interface FeedTrendingResponse {
  posts: PostItem[];
}

export interface RepliesResponse {
  replies: ReplyItem[];
}

export interface SearchPostsResponse {
  posts: PostItem[];
}
