import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostItem, ReplyItem } from '../../core/models/post.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [FormsModule, AvatarComponent, IconButtonComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  readonly post = input.required<PostItem>();
  readonly replies = input<ReplyItem[]>([]);
  readonly likedByMe = input(false);
  readonly likedReplyIDs = input<Set<string>>(new Set<string>());
  readonly currentUserID = input('');
  readonly isOwnPost = input(false);
  readonly liked = output<string>();
  readonly replied = output<{ postId: string; content: string }>();
  readonly subReplied = output<{ postId: string; parentReplyId: string; content: string }>();
  readonly replyUpdated = output<{ replyId: string; content: string }>();
  readonly replyDeleted = output<string>();
  readonly replyLiked = output<string>();
  readonly openReplies = output<string>();
  readonly postDeleted = output<string>();
  readonly postReported = output<{ postId: string; reason: string }>();

  readonly replying = signal(false);
  readonly showRepliesPanel = signal(false);
  readonly editingReplyID = signal('');
  readonly activeSubReplyParentID = signal('');
  replyText = '';
  editReplyText = '';
  subReplyText = '';

  like(): void {
    if (this.likedByMe()) {
      return;
    }

    this.liked.emit(this.post().id);
  }

  toggleReply(): void {
    this.replying.update((value) => !value);
    this.showRepliesPanel.set(true);
    this.openReplies.emit(this.post().id);
  }

  submitReply(): void {
    const trimmed = this.replyText.trim();
    if (!trimmed) {
      return;
    }

    this.replied.emit({ postId: this.post().id, content: trimmed });
    this.replyText = '';
    this.replying.set(false);
  }

  removePost(): void {
    this.postDeleted.emit(this.post().id);
  }

  reportPost(): void {
    const reason = prompt('Report reason (max 500 chars):')?.trim() ?? '';
    if (!reason) {
      return;
    }

    this.postReported.emit({ postId: this.post().id, reason });
  }

  isOwnReply(reply: ReplyItem): boolean {
    return reply.authorId === this.currentUserID();
  }

  directReplies(parentReplyID?: string): ReplyItem[] {
    return this.replies().filter((reply) => (reply.parentReplyId ?? '') === (parentReplyID ?? ''));
  }

  startEdit(reply: ReplyItem): void {
    this.editingReplyID.set(reply.id);
    this.editReplyText = reply.content;
  }

  cancelEdit(): void {
    this.editingReplyID.set('');
    this.editReplyText = '';
  }

  saveEdit(replyID: string): void {
    const trimmed = this.editReplyText.trim();
    if (!trimmed) {
      return;
    }

    this.replyUpdated.emit({ replyId: replyID, content: trimmed });
    this.cancelEdit();
  }

  removeReply(replyID: string): void {
    this.replyDeleted.emit(replyID);
  }

  likeReply(replyID: string): void {
    if (this.likedReplyIDs().has(replyID)) {
      return;
    }

    this.replyLiked.emit(replyID);
  }

  toggleSubReply(replyID: string): void {
    this.activeSubReplyParentID.update((value) => (value === replyID ? '' : replyID));
    if (this.activeSubReplyParentID() !== replyID) {
      this.subReplyText = '';
    }
  }

  submitSubReply(parentReplyID: string): void {
    const trimmed = this.subReplyText.trim();
    if (!trimmed) {
      return;
    }

    this.subReplied.emit({ postId: this.post().id, parentReplyId: parentReplyID, content: trimmed });
    this.subReplyText = '';
    this.activeSubReplyParentID.set('');
  }
}
