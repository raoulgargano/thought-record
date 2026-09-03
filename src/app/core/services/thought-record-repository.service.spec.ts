import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThoughtRecordDatabase } from '../database/thought-record.db';
import { ThoughtRecordDraft } from '../models/thought-record.model';
import { ThoughtRecordRepository } from './thought-record-repository.service';
import { getWeekRange } from '../utils/week.util';

/** Swaps the real browser IndexedDB for the in-memory fake used in tests. */
class TestThoughtRecordRepository extends ThoughtRecordRepository {
  protected override createDatabase(): ThoughtRecordDatabase {
    return new ThoughtRecordDatabase({ indexedDB, IDBKeyRange });
  }
}

function makeDraft(overrides: Partial<ThoughtRecordDraft> = {}): ThoughtRecordDraft {
  return {
    recordDate: new Date().toISOString(),
    situation: 'Reunión en el trabajo',
    thought: 'Voy a quedar mal',
    beliefLevel: 7,
    emotions: [{ id: 'temp-1', name: 'Ansiedad', intensity: 8 }],
    behavior: 'Evité levantar la mano',
    ...overrides,
  };
}

describe('ThoughtRecordRepository', () => {
  let repository: ThoughtRecordRepository;

  beforeEach(async () => {
    repository = new TestThoughtRecordRepository();
    await repository.ready;
    // fake-indexeddb persists across tests within the process, so start
    // each test from a clean slate under the shared 'ThoughtRecordDB' name.
    await repository.clearAll();
  });

  it('creates a record and assigns id/timestamps', async () => {
    const created = await repository.create(makeDraft());

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBe(created.createdAt);
    expect(created.situation).toBe('Reunión en el trabajo');
    expect(repository.records()).toHaveLength(1);
  });

  it('clamps out-of-range belief level and emotion intensity on create', async () => {
    const created = await repository.create(
      makeDraft({ beliefLevel: 99, emotions: [{ id: 'e1', name: 'Miedo', intensity: -20 }] }),
    );

    expect(created.beliefLevel).toBe(10);
    expect(created.emotions[0].intensity).toBe(0);
  });

  it('updates an existing record', async () => {
    const created = await repository.create(makeDraft());
    const updated = await repository.update(created.id, { situation: 'Situación actualizada' });

    expect(updated.situation).toBe('Situación actualizada');
    expect(updated.updatedAt).not.toBe(created.createdAt);
    expect(await repository.getById(created.id)).toMatchObject({
      situation: 'Situación actualizada',
    });
  });

  it('throws when updating a record that does not exist', async () => {
    await expect(repository.update('missing-id', { situation: 'x' })).rejects.toThrow();
  });

  it('deletes a record', async () => {
    const created = await repository.create(makeDraft());
    await repository.delete(created.id);

    expect(await repository.getById(created.id)).toBeUndefined();
    expect(repository.records()).toHaveLength(0);
  });

  it('lists all records most recent first', async () => {
    await repository.create(makeDraft({ recordDate: new Date(2026, 0, 1).toISOString() }));
    await repository.create(makeDraft({ recordDate: new Date(2026, 0, 3).toISOString() }));
    await repository.create(makeDraft({ recordDate: new Date(2026, 0, 2).toISOString() }));

    const all = await repository.getAll();
    expect(all.map((r) => r.recordDate)).toEqual([
      new Date(2026, 0, 3).toISOString(),
      new Date(2026, 0, 2).toISOString(),
      new Date(2026, 0, 1).toISOString(),
    ]);
  });

  it('filters records within a date range', async () => {
    await repository.create(makeDraft({ recordDate: new Date(2026, 0, 1).toISOString() }));
    await repository.create(makeDraft({ recordDate: new Date(2026, 0, 15).toISOString() }));

    const inRange = await repository.getByDateRange(new Date(2026, 0, 1), new Date(2026, 0, 10));
    expect(inRange).toHaveLength(1);
  });

  it('returns only records within the current week for getCurrentWeek', async () => {
    const now = new Date();
    const currentWeek = getWeekRange(now);
    const outsideWeek = new Date(currentWeek.start);
    outsideWeek.setDate(outsideWeek.getDate() - 8);

    await repository.create(makeDraft({ recordDate: now.toISOString() }));
    await repository.create(makeDraft({ recordDate: outsideWeek.toISOString() }));

    const week = await repository.getCurrentWeek();
    expect(week).toHaveLength(1);
  });

  it('clears all records', async () => {
    await repository.create(makeDraft());
    await repository.create(makeDraft());
    await repository.clearAll();

    expect(repository.records()).toHaveLength(0);
  });

  it('upserts imported records, counting created vs updated', async () => {
    const existing = await repository.create(makeDraft());

    const result = await repository.upsertMany([
      { ...existing, situation: 'Situación importada' },
      {
        id: 'new-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recordDate: new Date().toISOString(),
        situation: 'Nuevo',
        thought: 'Pensamiento nuevo',
        beliefLevel: 4,
        emotions: [],
        behavior: '',
      },
    ]);

    expect(result).toEqual({ created: 1, updated: 1 });
    expect(repository.records()).toHaveLength(2);
    expect((await repository.getById(existing.id))?.situation).toBe('Situación importada');
  });
});
