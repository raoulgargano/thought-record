import { describe, expect, it } from 'vitest';
import {
  clampBeliefLevel,
  clampEmotionIntensity,
  isValidBeliefLevel,
  isValidEmotionEntry,
  isValidEmotionIntensity,
  isValidThoughtRecord,
} from './validation.util';

describe('validation.util', () => {
  describe('belief level', () => {
    it('accepts values within 0-10', () => {
      expect(isValidBeliefLevel(0)).toBe(true);
      expect(isValidBeliefLevel(10)).toBe(true);
      expect(isValidBeliefLevel(5.5)).toBe(true);
    });

    it('rejects values outside 0-10', () => {
      expect(isValidBeliefLevel(-1)).toBe(false);
      expect(isValidBeliefLevel(11)).toBe(false);
      expect(isValidBeliefLevel(Number.NaN)).toBe(false);
    });

    it('clamps and rounds out-of-range belief levels', () => {
      expect(clampBeliefLevel(-5)).toBe(0);
      expect(clampBeliefLevel(15)).toBe(10);
      expect(clampBeliefLevel(7.6)).toBe(8);
    });
  });

  describe('emotion intensity', () => {
    it('accepts values within 0-10', () => {
      expect(isValidEmotionIntensity(0)).toBe(true);
      expect(isValidEmotionIntensity(10)).toBe(true);
    });

    it('rejects values outside 0-10', () => {
      expect(isValidEmotionIntensity(-1)).toBe(false);
      expect(isValidEmotionIntensity(12)).toBe(false);
    });

    it('clamps and rounds out-of-range intensities', () => {
      expect(clampEmotionIntensity(-2)).toBe(0);
      expect(clampEmotionIntensity(20)).toBe(10);
      expect(clampEmotionIntensity(3.4)).toBe(3);
    });
  });

  describe('isValidEmotionEntry', () => {
    it('accepts a well-formed emotion entry', () => {
      expect(isValidEmotionEntry({ id: '1', name: 'Ansiedad', intensity: 7 })).toBe(true);
    });

    it('rejects an entry with an out-of-range intensity', () => {
      expect(isValidEmotionEntry({ id: '1', name: 'Ansiedad', intensity: 42 })).toBe(false);
    });

    it('rejects an entry with an empty name', () => {
      expect(isValidEmotionEntry({ id: '1', name: '  ', intensity: 5 })).toBe(false);
    });

    it('rejects non-object values', () => {
      expect(isValidEmotionEntry(null)).toBe(false);
      expect(isValidEmotionEntry('Ansiedad')).toBe(false);
    });
  });

  describe('isValidThoughtRecord', () => {
    const valid = {
      id: 'r1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordDate: new Date().toISOString(),
      situation: 'Reunión de trabajo',
      thought: 'Voy a hacerlo mal',
      beliefLevel: 8,
      emotions: [{ id: 'e1', name: 'Ansiedad', intensity: 7 }],
      behavior: 'Evitar hablar',
    };

    it('accepts a well-formed thought record', () => {
      expect(isValidThoughtRecord(valid)).toBe(true);
    });

    it('rejects a record with an invalid belief level', () => {
      expect(isValidThoughtRecord({ ...valid, beliefLevel: 99 })).toBe(false);
    });

    it('rejects a record with an invalid emotion inside it', () => {
      expect(
        isValidThoughtRecord({
          ...valid,
          emotions: [{ id: 'e1', name: 'Ansiedad', intensity: -3 }],
        }),
      ).toBe(false);
    });

    it('rejects a record missing required fields', () => {
      const withoutSituation: Partial<typeof valid> = { ...valid };
      delete withoutSituation.situation;
      expect(isValidThoughtRecord(withoutSituation)).toBe(false);
    });
  });
});
