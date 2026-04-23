import type { Difficulty } from "@/types/game";

export interface DiffConfig {
  key: Difficulty;
  label: string;
  sub: string;
  wpmRange: string;
  color: string;
  glow: string;
  bots: { min: number; max: number }[];
}

export const DIFFICULTIES: DiffConfig[] = [
  // Easy: most bots are slow (15-30 WPM), one slightly faster. A beginner at ~25 WPM can beat 2/3 bots.
  { key: "easy", label: "Casual", sub: "Perfect for warming up", wpmRange: "15–35 WPM", color: "#2ecc71", glow: "rgba(46,204,113,0.12)", bots: [{ min: 12, max: 22 }, { min: 18, max: 28 }, { min: 25, max: 35 }] },
  // Medium: spread from 25-55. A ~40 WPM typist beats half.
  { key: "medium", label: "Competitive", sub: "Average typist challenge", wpmRange: "25–55 WPM", color: "#f39c12", glow: "rgba(243,156,18,0.12)", bots: [{ min: 22, max: 35 }, { min: 32, max: 45 }, { min: 40, max: 55 }, { min: 48, max: 58 }] },
  // Hard: 40-85. You need ~60 WPM to place top 3.
  { key: "hard", label: "Expert", sub: "For experienced typists", wpmRange: "40–85 WPM", color: "#e74c3c", glow: "rgba(231,76,60,0.12)", bots: [{ min: 38, max: 55 }, { min: 50, max: 68 }, { min: 60, max: 80 }, { min: 70, max: 88 }] },
  // Insane: 70-140. You need 100+ WPM to even podium.
  { key: "superhard", label: "Insane", sub: "Only the fastest survive", wpmRange: "70–140 WPM", color: "#c77dff", glow: "rgba(199,125,255,0.12)", bots: [{ min: 65, max: 90 }, { min: 80, max: 110 }, { min: 95, max: 125 }, { min: 110, max: 140 }, { min: 75, max: 100 }] },
];

export const WORD_COUNTS = [15, 20, 30, 50];

const PREFIXES = ["Swift","Quick","Flash","Rapid","Nimble","Pixel","Byte","Nova","Storm","Frost","Ember","Ghost","Spark","Volt","Blaze","Zephyr","Deft","Keen","Turbo","Brisk"];
const SUFFIXES = ["Typer","Keys","Bot","Pro","AI","Ace","Star","Touch","Master","Elite"];
const COLORS = ["#2ecc71","#3498db","#e74c3c","#a855f7","#1abc9c","#f39c12","#22d3ee","#f472b6","#c77dff","#6366f1","#84cc16"];

export function botName(): string {
  return PREFIXES[Math.random() * PREFIXES.length | 0] + SUFFIXES[Math.random() * SUFFIXES.length | 0] + (Math.random() * 999 | 0);
}
export function botColor(i: number): string { return COLORS[i % COLORS.length]; }
