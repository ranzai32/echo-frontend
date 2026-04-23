import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';
import { PostCardComponent } from '../../ui/post-card/post-card.component';
import { FeedStateService } from '../../core/services/feed-state.service';
import { SessionService } from '../../core/services/session.service';
import { PostItem } from '../../core/models/post.model';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [FormsModule, IconComponent, PostCardComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnInit {
  readonly state = inject(FeedStateService);
  readonly session = inject(SessionService);

  query = '';
  postID = '';
  readonly loading = signal(false);
  readonly results = signal<PostItem[]>([]);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    await this.session.ensureSession();
  }

  async submitSearch(): Promise<void> {
    const trimmed = this.query.trim();
    if (!trimmed) {
      this.results.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      const posts = await this.state.search(trimmed, 20);
      this.results.set(posts);
    } catch {
      this.error.set('Search failed.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadByID(): Promise<void> {
    const trimmed = this.postID.trim();
    if (!trimmed) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      const post = await this.state.getPost(trimmed);
      this.results.set([post]);
    } catch {
      this.error.set('Post not found by ID.');
    } finally {
      this.loading.set(false);
    }
  }
}
