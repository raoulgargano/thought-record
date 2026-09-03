import { EmotionEntry } from '../models/thought-record.model';

/** The emotion with the highest intensity, used as a card's headline emotion. */
export function getMainEmotion(emotions: EmotionEntry[]): EmotionEntry | undefined {
  if (emotions.length === 0) {
    return undefined;
  }
  return [...emotions].sort((a, b) => b.intensity - a.intensity)[0];
}
