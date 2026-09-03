import { describe, expect, it } from 'vitest';
import { getMainEmotion } from './emotion.util';

describe('emotion.util', () => {
  it('returns undefined for an empty list', () => {
    expect(getMainEmotion([])).toBeUndefined();
  });

  it('returns the emotion with the highest intensity', () => {
    const main = getMainEmotion([
      { id: 'a', name: 'Calma', intensity: 3 },
      { id: 'b', name: 'Ansiedad', intensity: 8 },
      { id: 'c', name: 'Tristeza', intensity: 5 },
    ]);
    expect(main?.name).toBe('Ansiedad');
  });

  it('does not mutate the original array order', () => {
    const emotions = [
      { id: 'a', name: 'Calma', intensity: 3 },
      { id: 'b', name: 'Ansiedad', intensity: 8 },
    ];
    getMainEmotion(emotions);
    expect(emotions[0].name).toBe('Calma');
  });
});
