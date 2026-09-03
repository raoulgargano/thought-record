import { beforeEach, describe, expect, it } from 'vitest';
import { ThoughtRecord } from '../models/thought-record.model';
import { BackupService, InvalidBackupFileError } from './backup.service';

function sampleRecord(id = 'r1'): ThoughtRecord {
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recordDate: new Date().toISOString(),
    situation: 'Situación',
    thought: 'Pensamiento',
    beliefLevel: 6,
    emotions: [{ id: 'e1', name: 'Calma', intensity: 3 }],
    behavior: 'Conducta',
  };
}

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    service = new BackupService();
  });

  it('serializes records into a self-describing backup file', () => {
    const json = service.serialize([sampleRecord()]);
    const parsed = JSON.parse(json);

    expect(parsed.recordCount).toBe(1);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.records[0].id).toBe('r1');
  });

  it('round-trips serialize -> parse', () => {
    const original = [sampleRecord('a'), sampleRecord('b')];
    const parsed = service.parse(service.serialize(original));

    expect(parsed.records).toHaveLength(2);
    expect(parsed.records.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('throws InvalidBackupFileError for malformed JSON', () => {
    expect(() => service.parse('{not json')).toThrow(InvalidBackupFileError);
  });

  it('throws InvalidBackupFileError when records is missing', () => {
    expect(() => service.parse(JSON.stringify({ schemaVersion: 1 }))).toThrow(
      InvalidBackupFileError,
    );
  });

  it('throws InvalidBackupFileError when a record fails validation', () => {
    const invalid = JSON.stringify({
      schemaVersion: 1,
      records: [{ ...sampleRecord(), beliefLevel: 500 }],
    });
    expect(() => service.parse(invalid)).toThrow(InvalidBackupFileError);
  });

  it('builds a filename with an ISO date', () => {
    const filename = service.suggestedFilename(new Date(2026, 8, 3));
    expect(filename).toBe('thought-record-backup-2026-09-03.json');
  });
});
