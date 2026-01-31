export interface WordItem {
  word: string;
  sentence: string; // Simple sentence for context
}

export interface GameState {
  category: string | null;
  words: WordItem[];
  currentIndex: number;
  score: number;
  mode: 'MENU' | 'LOADING_CATEGORY' | 'PLAYING' | 'VICTORY';
}

export interface LetterStatus {
  char: string;
  id: string; // Unique ID for React keys
  isPlaced: boolean;
}

export enum SoundType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WORD = 'WORD',
  SPELL = 'SPELL'
}
