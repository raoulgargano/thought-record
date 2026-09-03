import Dexie, { Table } from 'dexie';
import { ThoughtRecord } from '../models/thought-record.model';

export interface ThoughtRecordDatabaseDeps {
  indexedDB?: IDBFactory;
  IDBKeyRange?: typeof IDBKeyRange;
}

/**
 * Local-first IndexedDB store. All data lives exclusively on this device;
 * nothing here is ever sent to a server.
 *
 * Accepts explicit indexedDB/IDBKeyRange deps (used by tests to inject
 * fake-indexeddb) instead of relying on Dexie's module-load-time globals.
 */
export class ThoughtRecordDatabase extends Dexie {
  records!: Table<ThoughtRecord, string>;

  constructor(deps: ThoughtRecordDatabaseDeps = {}) {
    super('ThoughtRecordDB', deps);

    this.version(1).stores({
      records: 'id, recordDate, createdAt, updatedAt',
    });
  }
}
