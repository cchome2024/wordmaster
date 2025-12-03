export interface WordItem {
  id: number;
  word: string;
  frequencyRaw: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  rawLine: string;
}

export interface PlayerSettings {
  speed: number; // Delay between words in ms
  autoPlay: boolean;
}
