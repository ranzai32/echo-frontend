export type ModerationAction = 'dismiss' | 'hide' | 'ban';

export type ReportStatus = 'open' | 'resolved';

export interface AdminReport {
  id: string;
  postId: string;
  reason: string;
  status: ReportStatus;
  action: ModerationAction | '';
  actionNote: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  postContent: string;
  postPseudonym: string;
  postHidden: boolean;
}

export interface AdminReportsResponse {
  reports: AdminReport[];
}
