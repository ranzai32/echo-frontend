import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ShareService {
  constructor(private readonly api: ApiService) {}

  canUseNativeShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  async getPostShareUrl(postId: string): Promise<string> {
    try {
      return await this.api.getShareUrl(postId);
    } catch {
      const base = environment.appBaseUrl.replace(/\/$/, '');
      return `${base}/post/${postId}`;
    }
  }

  async copyUrl(url: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    if (typeof document === 'undefined') {
      throw new Error('clipboard unavailable');
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  async nativeShare(url: string): Promise<void> {
    if (!this.canUseNativeShare()) {
      throw new Error('native share unavailable');
    }

    await navigator.share({
      title: 'echo post',
      text: 'Check out this anonymous post on echo',
      url
    });
  }
}
