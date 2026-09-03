import { Injectable } from '@angular/core';

const STORAGE_PREFIX = 'thought-record:draft:';

/**
 * Keeps in-progress form input in localStorage so a reload or a brief
 * offline blip never loses what the user has typed.
 */
@Injectable({ providedIn: 'root' })
export class DraftService {
  save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable (private browsing, quota); losing draft
      // persistence silently is preferable to breaking the form.
    }
  }

  load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // Ignore storage errors on cleanup.
    }
  }
}
