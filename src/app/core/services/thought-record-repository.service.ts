import { Injectable, signal } from '@angular/core';
import { ThoughtRecordDatabase } from '../database/thought-record.db';
import { EmotionEntry, ThoughtRecord, ThoughtRecordDraft } from '../models/thought-record.model';
import { generateId } from '../utils/id.util';
import { clampBeliefLevel, clampEmotionIntensity } from '../utils/validation.util';
import { getWeekRange, isDateWithinWeek, WeekRange } from '../utils/week.util';

function sanitizeEmotions(emotions: EmotionEntry[]): EmotionEntry[] {
  return emotions
    .filter((emotion) => emotion.name.trim().length > 0)
    .map((emotion) => ({
      id: emotion.id || generateId(),
      name: emotion.name.trim(),
      intensity: clampEmotionIntensity(emotion.intensity),
    }));
}

function byRecordDateDesc(a: ThoughtRecord, b: ThoughtRecord): number {
  return b.recordDate.localeCompare(a.recordDate);
}

/**
 * Sole access point to persisted thought records. UI code must never talk to
 * Dexie directly so storage concerns stay swappable behind this API.
 */
@Injectable({ providedIn: 'root' })
export class ThoughtRecordRepository {
  private readonly db: ThoughtRecordDatabase;
  private readonly recordsSignal = signal<ThoughtRecord[]>([]);

  /** Reactive snapshot of every stored record, most recent first. */
  readonly records = this.recordsSignal.asReadonly();
  readonly ready: Promise<void>;

  constructor() {
    this.db = this.createDatabase();
    this.ready = this.refresh();
  }

  /**
   * Overridden in tests to inject an in-memory IndexedDB implementation
   * instead of the real browser one.
   */
  protected createDatabase(): ThoughtRecordDatabase {
    return new ThoughtRecordDatabase();
  }

  async refresh(): Promise<void> {
    const all = await this.db.records.toArray();
    this.recordsSignal.set(all.sort(byRecordDateDesc));
  }

  async create(draft: ThoughtRecordDraft): Promise<ThoughtRecord> {
    const now = new Date().toISOString();
    const record: ThoughtRecord = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      recordDate: draft.recordDate,
      situation: draft.situation.trim(),
      thought: draft.thought.trim(),
      beliefLevel: clampBeliefLevel(draft.beliefLevel),
      emotions: sanitizeEmotions(draft.emotions),
      behavior: draft.behavior.trim(),
    };
    await this.db.records.add(record);
    await this.refresh();
    return record;
  }

  async update(id: string, changes: Partial<ThoughtRecordDraft>): Promise<ThoughtRecord> {
    const existing = await this.db.records.get(id);
    if (!existing) {
      throw new Error(`ThoughtRecord ${id} not found`);
    }

    const updated: ThoughtRecord = {
      ...existing,
      ...changes,
      situation: (changes.situation ?? existing.situation).trim(),
      thought: (changes.thought ?? existing.thought).trim(),
      behavior: (changes.behavior ?? existing.behavior).trim(),
      beliefLevel: clampBeliefLevel(changes.beliefLevel ?? existing.beliefLevel),
      emotions: sanitizeEmotions(changes.emotions ?? existing.emotions),
      updatedAt: new Date().toISOString(),
    };
    await this.db.records.put(updated);
    await this.refresh();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.records.delete(id);
    await this.refresh();
  }

  async getById(id: string): Promise<ThoughtRecord | undefined> {
    return this.db.records.get(id);
  }

  async getAll(): Promise<ThoughtRecord[]> {
    const all = await this.db.records.toArray();
    return all.sort(byRecordDateDesc);
  }

  async getByDateRange(start: Date, end: Date): Promise<ThoughtRecord[]> {
    const all = await this.getAll();
    return all.filter((record) => {
      const date = new Date(record.recordDate);
      return date >= start && date <= end;
    });
  }

  async getWeek(range: WeekRange): Promise<ThoughtRecord[]> {
    const all = await this.getAll();
    return all.filter((record) => isDateWithinWeek(new Date(record.recordDate), range));
  }

  async getCurrentWeek(): Promise<ThoughtRecord[]> {
    return this.getWeek(getWeekRange(new Date()));
  }

  async clearAll(): Promise<void> {
    await this.db.records.clear();
    await this.refresh();
  }

  /**
   * Inserts or replaces records by id without touching anything else,
   * used by backup restore. Returns how many rows were new vs. replaced.
   */
  async upsertMany(records: ThoughtRecord[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    await this.db.transaction('rw', this.db.records, async () => {
      for (const record of records) {
        const exists = await this.db.records.get(record.id);
        if (exists) {
          updated += 1;
        } else {
          created += 1;
        }
        await this.db.records.put(record);
      }
    });
    await this.refresh();
    return { created, updated };
  }
}
