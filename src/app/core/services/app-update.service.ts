import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, interval } from 'rxjs';

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Stops an installed PWA from getting stuck on a stale cached build: it asks
 * the service worker for a newer version on startup and periodically after
 * that, then activates the new version and reloads.
 *
 * Reloading unprompted is safe here because form drafts are continuously
 * persisted to localStorage and records live in IndexedDB.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly subscriptions = new Subscription();

  start(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.checkForUpdate();
    this.subscriptions.add(
      interval(UPDATE_CHECK_INTERVAL_MS).subscribe(() => this.checkForUpdate()),
    );

    this.subscriptions.add(
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          void this.swUpdate.activateUpdate().then(() => this.reload());
        }
      }),
    );
  }

  stop(): void {
    this.subscriptions.unsubscribe();
  }

  private checkForUpdate(): void {
    // Rejects when the service worker isn't ready yet; nothing to do then.
    void this.swUpdate.checkForUpdate().catch(() => undefined);
  }

  /** Overridden in tests so no real navigation happens. */
  protected reload(): void {
    document.location.reload();
  }
}
