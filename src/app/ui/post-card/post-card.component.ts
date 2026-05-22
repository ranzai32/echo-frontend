import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostItem, ReplyItem } from '../../core/models/post.model';
import { ApiService } from '../../core/services/api.service';
import { ShareService } from '../../core/services/share.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [FormsModule, AvatarComponent, IconButtonComponent, IconComponent, NgTemplateOutlet, DatePipe],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  private readonly shareService = inject(ShareService);
  readonly nativeShareAvailable = this.shareService.canUseNativeShare();

  readonly post = input.required<PostItem>();
  readonly replies = input<ReplyItem[]>([]);
  readonly showReplies = input(false);
  readonly likedByMe = input(false);
  readonly likedReplyIDs = input<Set<string>>(new Set<string>());
  readonly currentUserID = input('');
  readonly isOwnPost = input(false);
  readonly liked = output<string>();
  readonly openPost = output<string>();
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
  readonly reportDialogOpen = signal(false);
  readonly reportSubmitting = signal(false);
  readonly reportError = signal('');
  readonly shareDialogOpen = signal(false);
  readonly shareUrl = signal('');
  readonly shareLoading = signal(false);
  readonly shareCopying = signal(false);
  readonly shareCopied = signal(false);
  readonly shareError = signal('');
  readonly editingReplyID = signal('');
  readonly activeSubReplyParentID = signal('');
  replyText = '';
  editReplyText = '';
  subReplyText = '';
  reportReason = '';

  readonly reportReasons = [
    'Spam or phishing',
    'Harassment or abuse',
    'Hate or discrimination',
    'Misinformation',
    'Illegal or harmful content',
    'Other'
  ];

  constructor(private readonly api: ApiService) {
    effect(() => {
      if (this.showReplies()) {
        this.showRepliesPanel.set(true);
      }
    }, { allowSignalWrites: true });
  }

  attachmentUrl(id: string): string {
    return this.api.attachmentUrl(id);
  }

  isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  formatSize(size: number): string {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  open(): void {
    this.openPost.emit(this.post().id);
  }

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

  sharePost(): void {
    this.shareError.set('');
    this.shareCopied.set(false);
    this.shareDialogOpen.set(true);
    void this.loadShareUrl();
  }

  closeShareDialog(): void {
    this.shareDialogOpen.set(false);
    this.shareLoading.set(false);
    this.shareCopying.set(false);
    this.shareCopied.set(false);
    this.shareError.set('');
    this.shareUrl.set('');
  }

  async copyShareLink(): Promise<void> {
    const url = this.shareUrl().trim();
    if (!url || this.shareCopying()) {
      return;
    }

    this.shareCopying.set(true);
    this.shareError.set('');
    try {
      await this.shareService.copyUrl(url);
      this.shareCopied.set(true);
    } catch {
      this.shareError.set('Could not copy link. Try again.');
    } finally {
      this.shareCopying.set(false);
    }
  }

  async sendShareLink(): Promise<void> {
    const url = this.shareUrl().trim();
    if (!url) {
      return;
    }

    this.shareError.set('');
    try {
      await this.shareService.nativeShare(url);
      this.closeShareDialog();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      this.shareError.set('Could not open share menu.');
    }
  }

  sharePreview(): string {
    const content = this.post().content.trim();
    if (content.length <= 120) {
      return content;
    }

    return `${content.slice(0, 120)}…`;
  }

  reportPost(): void {
    this.reportError.set('');
    this.reportDialogOpen.set(true);
  }

  private async loadShareUrl(): Promise<void> {
    this.shareLoading.set(true);
    this.shareUrl.set('');
    try {
      const url = await this.shareService.getPostShareUrl(this.post().id);
      this.shareUrl.set(url);
    } catch {
      this.shareError.set('Could not load share link.');
    } finally {
      this.shareLoading.set(false);
    }
  }

  closeReportDialog(): void {
    this.reportDialogOpen.set(false);
    this.reportSubmitting.set(false);
    this.reportError.set('');
    this.reportReason = '';
  }

  pickReportReason(reason: string): void {
    this.reportReason = reason;
  }

  submitReport(): void {
    const reason = this.reportReason.trim();
    if (!reason) {
      this.reportError.set('Please choose or enter a reason.');
      return;
    }

    this.reportSubmitting.set(true);
    this.postReported.emit({ postId: this.post().id, reason });
    this.closeReportDialog();
  }

  isOwnReply(reply: ReplyItem): boolean {
    return reply.authorId === this.currentUserID();
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
