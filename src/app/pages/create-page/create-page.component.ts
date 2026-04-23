import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PostComposerComponent } from '../../ui/post-composer/post-composer.component';
import { FeedStateService } from '../../core/services/feed-state.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-create-page',
  standalone: true,
  imports: [PostComposerComponent],
  templateUrl: './create-page.component.html',
  styleUrl: './create-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePageComponent {
  constructor(
    readonly session: SessionService,
    private readonly state: FeedStateService
  ) {
    void this.session.ensureSession();
  }

  async onCreate(content: string): Promise<void> {
    await this.state.createPost(content);
  }
}
