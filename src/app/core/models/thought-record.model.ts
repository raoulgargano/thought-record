export const BELIEF_LEVEL_MIN = 0;
export const BELIEF_LEVEL_MAX = 10;
export const EMOTION_INTENSITY_MIN = 0;
export const EMOTION_INTENSITY_MAX = 10;

export interface EmotionEntry {
  id: string;
  name: string;
  intensity: number;
}

export interface ThoughtRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  recordDate: string;
  situation: string;
  thought: string;
  beliefLevel: number;
  emotions: EmotionEntry[];
  behavior: string;
}

export type ThoughtRecordDraft = Omit<ThoughtRecord, 'id' | 'createdAt' | 'updatedAt'>;

export const PREDEFINED_EMOTIONS = [
  'Ansiedad',
  'Tristeza',
  'Enfado',
  'Miedo',
  'Culpa',
  'Vergüenza',
  'Frustración',
  'Alegría',
  'Calma',
] as const;

export const CUSTOM_EMOTION_OPTION = 'Otra';
