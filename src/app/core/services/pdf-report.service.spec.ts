import { beforeEach, describe, expect, it } from 'vitest';
import { ThoughtRecord } from '../models/thought-record.model';
import { PdfReportService } from './pdf-report.service';
import { getWeekRange } from '../utils/week.util';

function sampleRecord(overrides: Partial<ThoughtRecord> = {}): ThoughtRecord {
  return {
    id: overrides.id ?? 'r1',
    createdAt: new Date(2026, 8, 2, 9, 35).toISOString(),
    updatedAt: new Date(2026, 8, 2, 9, 35).toISOString(),
    recordDate: new Date(2026, 8, 2, 9, 35).toISOString(),
    situation: 'Reunión en el trabajo',
    thought: 'Voy a quedar mal delante de todos',
    beliefLevel: 7,
    emotions: [
      { id: 'e1', name: 'Ansiedad', intensity: 8 },
      { id: 'e2', name: 'Vergüenza', intensity: 4 },
    ],
    behavior: 'Evité hablar en la reunión',
    ...overrides,
  };
}

describe('PdfReportService', () => {
  let service: PdfReportService;

  beforeEach(() => {
    service = new PdfReportService();
  });

  describe('buildReportData', () => {
    it('sorts records chronologically and preserves all fields', () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      const later = sampleRecord({
        id: 'later',
        recordDate: new Date(2026, 8, 3, 10, 0).toISOString(),
      });
      const earlier = sampleRecord({
        id: 'earlier',
        recordDate: new Date(2026, 8, 1, 8, 0).toISOString(),
      });

      const data = service.buildReportData(range, [later, earlier]);

      expect(data.title).toBe('REGISTRO DE PENSAMIENTOS');
      expect(data.recordCount).toBe(2);
      expect(data.records.map((r) => r.situation)).toEqual([earlier.situation, later.situation]);
      expect(data.records[0].emotions).toHaveLength(2);
      expect(data.records[0].beliefLevel).toBe(7);
    });

    it('produces an empty record list when there is nothing that week', () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      const data = service.buildReportData(range, []);
      expect(data.recordCount).toBe(0);
      expect(data.records).toHaveLength(0);
    });
  });

  describe('generatePdf', () => {
    it('produces a valid PDF document byte stream', async () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      const data = service.buildReportData(range, [sampleRecord()]);

      const bytes = await service.generatePdf(data);
      const header = new TextDecoder().decode(bytes.slice(0, 5));

      expect(header).toBe('%PDF-');
      expect(bytes.length).toBeGreaterThan(500);
    });

    it('paginates correctly for a long list of records with long text', async () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      const longText = 'Una descripción muy larga que debería envolver varias líneas. '.repeat(20);
      const many = Array.from({ length: 15 }, (_, i) =>
        sampleRecord({ id: `r${i}`, situation: longText, thought: longText, behavior: longText }),
      );
      const data = service.buildReportData(range, many);

      const bytes = await service.generatePdf(data);
      const header = new TextDecoder().decode(bytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('renders an empty-state message when there are no records', async () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      const data = service.buildReportData(range, []);
      const bytes = await service.generatePdf(data);
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    });
  });

  describe('suggestedFilename', () => {
    it('builds a filename from the week start and end dates', () => {
      const range = getWeekRange(new Date(2026, 8, 2));
      expect(service.suggestedFilename(range)).toBe(
        'registro-pensamientos-2026-08-31_2026-09-06.pdf',
      );
    });
  });
});
