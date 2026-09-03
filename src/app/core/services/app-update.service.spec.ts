import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdateService } from './app-update.service';

class TestAppUpdateService extends AppUpdateService {
  reloadCount = 0;

  protected override reload(): void {
    this.reloadCount += 1;
  }
}

interface FakeSwUpdate {
  isEnabled: boolean;
  versionUpdates: Subject<VersionEvent>;
  checkForUpdate: () => Promise<boolean>;
  activateUpdate: () => Promise<boolean>;
}

function setup(isEnabled: boolean): { service: TestAppUpdateService; swUpdate: FakeSwUpdate } {
  const swUpdate: FakeSwUpdate = {
    isEnabled,
    versionUpdates: new Subject<VersionEvent>(),
    checkForUpdate: vi.fn().mockResolvedValue(true),
    activateUpdate: vi.fn().mockResolvedValue(true),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SwUpdate, useValue: swUpdate }],
  });

  const service = TestBed.runInInjectionContext(() => new TestAppUpdateService());
  return { service, swUpdate };
}

describe('AppUpdateService', () => {
  let context: ReturnType<typeof setup>;

  beforeEach(() => {
    context = setup(true);
  });

  it('checks for a new version on startup', () => {
    context.service.start();
    expect(context.swUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('activates a ready version and reloads', async () => {
    context.service.start();
    context.swUpdate.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(context.swUpdate.activateUpdate).toHaveBeenCalled();
    expect(context.service.reloadCount).toBe(1);
  });

  it('ignores version events that are not ready to activate', async () => {
    context.service.start();
    context.swUpdate.versionUpdates.next({
      type: 'VERSION_DETECTED',
      version: { hash: 'new' },
    });
    await Promise.resolve();

    expect(context.swUpdate.activateUpdate).not.toHaveBeenCalled();
    expect(context.service.reloadCount).toBe(0);
  });

  it('does nothing when the service worker is not enabled', () => {
    const disabled = setup(false);
    disabled.service.start();
    expect(disabled.swUpdate.checkForUpdate).not.toHaveBeenCalled();
  });
});
