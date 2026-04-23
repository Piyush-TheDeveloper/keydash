export type Difficulty = "easy" | "medium" | "hard" | "superhard";
export type Phase = "lobby" | "countdown" | "racing" | "finished";

export interface Player {
  id: string;
  name: string;
  type: "human" | "bot";
  progress: number;
  wpm: number;
  accuracy: number;
  currentWord: string;
  finished: boolean;
  finishTime: number | null;
  placement: number | null;
  color: string;
  seed: number;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number | null;
  wpm: number;
  spw: number;
}

export interface ReplayFrame {
  time: number;
  charIndex: number;
  states: number[];
}

export interface TypingState {
  charIndex: number;
  wordIndex: number;
  input: string;
  errors: number;
  keystrokes: number;
  correctChars: number;
  startTime: number | null;
  charStates: number[]; // 0=idle 1=correct 2=wrong
}

export interface BotState {
  id: string;
  targetWpm: number;
  charsTyped: number;
  bursting: boolean;
  burstTimer: number;
  paused: boolean;
  pauseUntil: number;
  finished: boolean;
  startTime: number;
}
