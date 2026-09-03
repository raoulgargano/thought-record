import {
  BELIEF_LEVEL_MAX,
  BELIEF_LEVEL_MIN,
  EMOTION_INTENSITY_MAX,
  EMOTION_INTENSITY_MIN,
  EmotionEntry,
  ThoughtRecord,
} from '../models/thought-record.model';

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function isValidBeliefLevel(value: number): boolean {
  return Number.isFinite(value) && value >= BELIEF_LEVEL_MIN && value <= BELIEF_LEVEL_MAX;
}

export function isValidEmotionIntensity(value: number): boolean {
  return Number.isFinite(value) && value >= EMOTION_INTENSITY_MIN && value <= EMOTION_INTENSITY_MAX;
}

export function clampBeliefLevel(value: number): number {
  return clamp(Math.round(value), BELIEF_LEVEL_MIN, BELIEF_LEVEL_MAX);
}

export function clampEmotionIntensity(value: number): number {
  return clamp(Math.round(value), EMOTION_INTENSITY_MIN, EMOTION_INTENSITY_MAX);
}

export function isValidEmotionEntry(emotion: unknown): emotion is EmotionEntry {
  if (typeof emotion !== 'object' || emotion === null) {
    return false;
  }
  const candidate = emotion as Partial<EmotionEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.intensity === 'number' &&
    isValidEmotionIntensity(candidate.intensity)
  );
}

export function isValidThoughtRecord(record: unknown): record is ThoughtRecord {
  if (typeof record !== 'object' || record === null) {
    return false;
  }
  const candidate = record as Partial<ThoughtRecord>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.recordDate === 'string' &&
    typeof candidate.situation === 'string' &&
    typeof candidate.thought === 'string' &&
    typeof candidate.behavior === 'string' &&
    typeof candidate.beliefLevel === 'number' &&
    isValidBeliefLevel(candidate.beliefLevel) &&
    Array.isArray(candidate.emotions) &&
    candidate.emotions.every((emotion) => isValidEmotionEntry(emotion))
  );
}
