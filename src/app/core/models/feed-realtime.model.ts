import { PostItem, ReplyItem } from './post.model';

export type FeedRealtimeEvent =
  | { type: 'post.created'; post: PostItem }
  | { type: 'post.deleted'; postId: string }
  | { type: 'post.updated'; postId: string; score: number; replyCount: number }
  | { type: 'post.hidden'; postId: string }
  | { type: 'reply.created'; reply: ReplyItem }
  | { type: 'reply.updated'; reply: ReplyItem }
  | { type: 'reply.deleted'; postId: string; replyId: string };

export interface FeedRealtimeEnvelope {
  type: string;
  payload: unknown;
}
