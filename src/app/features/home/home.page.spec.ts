import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThoughtRecord } from '../../core/models/thought-record.model';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';
import { getCurrentWeekRange } from '../../core/utils/week.util';
import { HomePage } from './home.page';

function makeRecord(overrides: Partial<ThoughtRecord>): ThoughtRecord {
  return {
    id: overrides.id ?? 'r1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recordDate: overrides.recordDate ?? new Date().toISOString(),
    situation: 'Situación',
    thought: 'Pensamiento',
    beliefLevel: 5,
    emotions: [],
    behavior: '',
    ...overrides,
  };
}

describe('HomePage', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('only includes records that fall within the current week', () => {
    const range = getCurrentWeekRange();
    const insideWeek = makeRecord({ id: 'inside', recordDate: range.start.toISOString() });
    const lastWeek = new Date(range.start);
    lastWeek.setDate(lastWeek.getDate() - 8);
    const outsideWeek = makeRecord({ id: 'outside', recordDate: lastWeek.toISOString() });

    const fakeRepository = {
      records: signal([insideWeek, outsideWeek]),
    } as unknown as ThoughtRecordRepository;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ThoughtRecordRepository, useValue: fakeRepository },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new HomePage());

    expect(page.weekRecords().map((record) => record.id)).toEqual(['inside']);
  });

  it('reports an empty week when nothing was recorded', () => {
    const fakeRepository = { records: signal([]) } as unknown as ThoughtRecordRepository;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ThoughtRecordRepository, useValue: fakeRepository },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new HomePage());

    expect(page.weekRecords()).toHaveLength(0);
  });
});
