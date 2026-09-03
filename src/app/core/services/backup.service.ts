import { Injectable } from '@angular/core';
import { ThoughtRecord } from '../models/thought-record.model';
import { isValidThoughtRecord } from '../utils/validation.util';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupFile {
  schemaVersion: number;
  exportedAt: string;
  recordCount: number;
  records: ThoughtRecord[];
}

export class InvalidBackupFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackupFileError';
  }
}

/**
 * Serializes/deserializes the full local dataset to a self-contained JSON
 * file the user can store outside the browser and restore later.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  buildBackup(records: ThoughtRecord[]): BackupFile {
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    };
  }

  serialize(records: ThoughtRecord[]): string {
    return JSON.stringify(this.buildBackup(records), null, 2);
  }

  /** Validates and parses raw JSON text into a BackupFile, or throws InvalidBackupFileError. */
  parse(json: string): BackupFile {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new InvalidBackupFileError('El archivo no contiene JSON válido.');
    }

    if (typeof data !== 'object' || data === null) {
      throw new InvalidBackupFileError(
        'El archivo de copia de seguridad no tiene el formato esperado.',
      );
    }

    const candidate = data as Partial<BackupFile>;
    if (!Array.isArray(candidate.records)) {
      throw new InvalidBackupFileError('El archivo no contiene una lista de registros.');
    }

    const invalidRecord = candidate.records.find((record) => !isValidThoughtRecord(record));
    if (invalidRecord) {
      throw new InvalidBackupFileError('Uno o más registros del archivo no son válidos.');
    }

    return {
      schemaVersion:
        typeof candidate.schemaVersion === 'number'
          ? candidate.schemaVersion
          : BACKUP_SCHEMA_VERSION,
      exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
      recordCount: candidate.records.length,
      records: candidate.records as ThoughtRecord[],
    };
  }

  suggestedFilename(date: Date = new Date()): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `thought-record-backup-${isoDate}.json`;
  }
}
