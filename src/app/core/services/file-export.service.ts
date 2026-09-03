import { Injectable } from '@angular/core';

/**
 * Thin wrapper around browser download/share primitives so feature code
 * doesn't repeat anchor-click and navigator.share boilerplate.
 */
@Injectable({ providedIn: 'root' })
export class FileExportService {
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  canShareFile(file: File): boolean {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    return (
      typeof nav.share === 'function' &&
      typeof nav.canShare === 'function' &&
      nav.canShare({ files: [file] })
    );
  }

  /**
   * Shares a file via the Web Share API when supported, otherwise falls
   * back to a direct download. Returns 'shared' or 'downloaded'.
   */
  async shareOrDownload(
    blob: Blob,
    filename: string,
    mimeType: string,
    shareTitle: string,
  ): Promise<'shared' | 'downloaded'> {
    const file = new File([blob], filename, { type: mimeType });
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (this.canShareFile(file) && nav.share) {
      try {
        await nav.share({ files: [file], title: shareTitle });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'shared';
        }
        // Fall through to download if sharing failed for any other reason.
      }
    }

    this.downloadBlob(blob, filename);
    return 'downloaded';
  }
}
