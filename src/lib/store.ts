import { create } from "zustand";
import type { Difficulty, Phase, Player, TypingState, BotState, WordTiming, ReplayFrame } from "@/types/game";
import { generateText } from "@/lib/words";
import { DIFFICULTIES, botName, botColor } from "@/lib/config";
import { supabase, getRaceChannel } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Store {
  difficulty: Difficulty; wordCount: number; playerName: string; playerId: string;
  roomId: string | null; roomCode: string | null; channel: RealtimeChannel | null; isHost: boolean;
  phase: Phase; text: string; words: string[]; players: Player[]; bots: BotState[]; typing: TypingState;
  startTime: number | null; elapsed: number; placementCounter: number; countdown: number;
  wordTimings: WordTiming[]; replay: ReplayFrame[]; replayIntervalId: ReturnType<typeof setInterval> | null;
  setDifficulty: (d: Difficulty) => void; setWordCount: (n: number) => void; setPlayerName: (n: string) => void;
  initLocalRace: (isMultiplayer?: boolean) => void; startCountdown: () => void; decrementCountdown: () => void;
  handleKey: (e: KeyboardEvent) => void; tickBots: () => void; tickTimer: () => void;
  finishPlayer: (id: string) => void; reset: () => void;
  _initParticipantRace: (text: string, difficulty: Difficulty, wordCount: number) => void;
  createRoom: () => Promise<string | null>; joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void; broadcastProgress: () => void;
}

const emptyTyping = (): TypingState => ({ charIndex: 0, wordIndex: 0, input: "", errors: 0, keystrokes: 0, correctChars: 0, startTime: null, charStates: [] });
const pid = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useStore = create<Store>((set, get) => ({
  difficulty: "easy", wordCount: 20, playerName: "", playerId: pid(),
  roomId: null, roomCode: null, channel: null, isHost: false,
  phase: "lobby", text: "", words: [], players: [], bots: [], typing: emptyTyping(),
  startTime: null, elapsed: 0, placementCounter: 0, countdown: 3,
  wordTimings: [], replay: [], replayIntervalId: null,

  setDifficulty: (d) => set({ difficulty: d }),
  setWordCount: (n) => set({ wordCount: n }),
  setPlayerName: (n) => set({ playerName: n }),

  // ===================== INIT RACE =====================
  // isMultiplayer: true = Create Room (no bots), false = Quick Play (with bots)
  initLocalRace: (isMultiplayer = false) => {
    const { difficulty, wordCount, playerName, playerId } = get();
    const name = playerName.trim() || `Racer${Math.random() * 999 | 0}`;
    const text = generateText(wordCount, difficulty);
    const words = text.split(" ");
    const diff = DIFFICULTIES.find((d) => d.key === difficulty)!;
    const human: Player = { id: playerId, name, type: "human", progress: 0, wpm: 0, accuracy: 100, currentWord: words[0], finished: false, finishTime: null, placement: null, color: "#e67e22", seed: Math.random() * 1e4 | 0 };
    const players: Player[] = [human];
    const bots: BotState[] = [];

    // Only add bots in Quick Play (solo mode), NOT in multiplayer rooms
    if (!isMultiplayer) {
      diff.bots.forEach((b, i) => {
        const id = `bot_${i}`;
        players.push({ id, name: botName(), type: "bot", progress: 0, wpm: 0, accuracy: 95 + Math.random() * 4, currentWord: "", finished: false, finishTime: null, placement: null, color: botColor(i), seed: Math.random() * 1e4 | 0 });
        bots.push({ id, targetWpm: b.min + Math.random() * (b.max - b.min), charsTyped: 0, bursting: false, burstTimer: 1 + Math.random() * 2, paused: false, pauseUntil: 0, finished: false, startTime: 0 });
      });
    }

    set({ text, words, players, bots, playerName: name, typing: { ...emptyTyping(), charStates: new Array(text.length).fill(0) }, startTime: null, elapsed: 0, placementCounter: 0, wordTimings: [{ word: words[0], startTime: 0, endTime: null, wpm: 0, spw: 0 }], replay: [], replayIntervalId: null });
  },

  // Set up race state for a participant (NO BOTS — multiplayer is humans only)
  _initParticipantRace: (text: string, difficulty: Difficulty, wordCount: number) => {
    const { playerName, playerId, players: existingPlayers } = get();
    const name = playerName.trim() || `Racer${Math.random() * 999 | 0}`;
    const words = text.split(" ");
    const human: Player = { id: playerId, name, type: "human", progress: 0, wpm: 0, accuracy: 100, currentWord: words[0], finished: false, finishTime: null, placement: null, color: "#4a9eff", seed: Math.random() * 1e4 | 0 };
    const players: Player[] = [human];

    // Keep any known remote players (other humans already in the room)
    const remotes = existingPlayers.filter((p) => p.type === "human" && p.id !== playerId);
    remotes.forEach((rp) => { if (!players.find((p) => p.id === rp.id)) players.push({ ...rp, progress: 0, wpm: 0, finished: false, finishTime: null, placement: null }); });

    set({ text, words, players, bots: [], difficulty, wordCount, playerName: name, typing: { ...emptyTyping(), charStates: new Array(text.length).fill(0) }, startTime: null, elapsed: 0, placementCounter: 0, wordTimings: [{ word: words[0], startTime: 0, endTime: null, wpm: 0, spw: 0 }], replay: [], replayIntervalId: null });
  },

  // ===================== COUNTDOWN =====================
  startCountdown: () => {
    const { channel, isHost, text, difficulty, wordCount } = get();
    set({ phase: "countdown", countdown: 3 });
    if (channel && isHost) {
      // Broadcast to all participants: "race is starting, here's the text"
      channel.send({ type: "broadcast", event: "room_event", payload: { event: "countdown_start", text, difficulty, wordCount } });
    }
  },

  decrementCountdown: () => {
    const { countdown, bots, channel, isHost } = get();
    if (countdown <= 1) {
      const now = Date.now();
      bots.forEach((b) => (b.startTime = now));
      const rid = setInterval(() => { const s = get(); if (s.phase === "racing") s.replay.push({ time: Date.now() - (s.startTime || now), charIndex: s.typing.charIndex, states: [...s.typing.charStates] }); }, 80);
      set({ phase: "racing", countdown: 0, startTime: now, replayIntervalId: rid });
    } else {
      set({ countdown: countdown - 1 });
      // Broadcast countdown tick so all clients stay synced
      if (channel && isHost) {
        channel.send({ type: "broadcast", event: "room_event", payload: { event: "countdown_tick", countdown: countdown - 1 } });
      }
    }
  },

  // ===================== TYPING =====================
  handleKey: (e: KeyboardEvent) => {
    const s = get();
    if (s.phase !== "racing") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const { text, words, typing: T, playerId } = s;
    const now = Date.now();
    let { charIndex: ci, wordIndex: wi, input, errors, keystrokes, correctChars, startTime: tst, charStates } = T;
    if (!tst) tst = now;
    keystrokes++;
    let ws = 0; for (let i = 0; i < wi; i++) ws += words[i].length + 1;
    const cw = words[wi];

    if (e.key === "Backspace") {
      if (input.length > 0) { const ns = [...charStates]; ns[ws + input.length - 1] = 0; set({ typing: { ...T, input: input.slice(0, -1), charIndex: ws + input.length - 1, charStates: ns, startTime: tst, keystrokes } }); }
      return;
    }
    if (e.key.length > 1 && e.key !== " ") return;

    if (e.key === " ") {
      if (input === cw) {
        const si = ws + cw.length; const ns = [...charStates]; if (si < text.length) ns[si] = 1;
        const wts = [...s.wordTimings]; const wt = wts[wts.length - 1];
        if (wt) { wt.endTime = now - tst; const dur = (wt.endTime - (wt.startTime || 0)) / 1000; wt.spw = dur; wt.wpm = dur > 0 ? (cw.length / 5) / (dur / 60) : 0; }
        const nwi = wi + 1;
        if (nwi < words.length) wts.push({ word: words[nwi], startTime: now - tst, endTime: null, wpm: 0, spw: 0 });
        const cc = correctChars + cw.length + 1;
        const em = (now - tst) / 6e4; const wpm = em > 0.01 ? Math.round((cc / 5) / em) : 0;
        const acc = keystrokes > 0 ? Math.round(((keystrokes - errors) / keystrokes) * 100) : 100;
        const prog = (si + 1) / text.length;
        const np = s.players.map((p) => p.id === playerId ? { ...p, progress: prog, wpm, accuracy: acc, currentWord: words[nwi] || "" } : p);
        set({ typing: { charIndex: si + 1, wordIndex: nwi, input: "", errors, keystrokes, correctChars: cc, startTime: tst, charStates: ns }, players: np, wordTimings: wts });
        get().broadcastProgress();
      }
      return;
    }

    const ei = ws + input.length; const ns = [...charStates];
    if (e.key === text[ei]) {
      ns[ei] = 1; const ni = input + e.key; const nci = ei + 1; const cc = correctChars + 1;
      const last = wi === words.length - 1 && ni === cw;
      if (last) {
        const wts = [...s.wordTimings]; const wt = wts[wts.length - 1];
        if (wt) { wt.endTime = now - tst; const dur = (wt.endTime - (wt.startTime || 0)) / 1000; wt.spw = dur; wt.wpm = dur > 0 ? (cw.length / 5) / (dur / 60) : 0; }
        const em = (now - tst) / 6e4; const wpm = em > 0.01 ? Math.round((cc / 5) / em) : 0;
        const acc = keystrokes > 0 ? Math.round(((keystrokes - errors) / keystrokes) * 100) : 100;
        const el = now - (s.startTime || now);
        const np = s.players.map((p) => p.id === playerId ? { ...p, progress: 1, wpm, accuracy: acc, finished: true, finishTime: el } : p);
        s.replay.push({ time: el, charIndex: nci, states: [...ns] });
        if (s.replayIntervalId) clearInterval(s.replayIntervalId);
        set({ typing: { charIndex: nci, wordIndex: wi, input: ni, errors, keystrokes, correctChars: cc, startTime: tst, charStates: ns }, players: np, wordTimings: wts });
        get().finishPlayer(playerId);
        get().broadcastProgress();
        return;
      }
      const em = (now - tst) / 6e4; const wpm = em > 0.01 ? Math.round((cc / 5) / em) : 0;
      const acc = keystrokes > 0 ? Math.round(((keystrokes - errors) / keystrokes) * 100) : 100;
      const prog = nci / text.length;
      const np = s.players.map((p) => p.id === playerId ? { ...p, progress: prog, wpm, accuracy: acc } : p);
      set({ typing: { charIndex: nci, wordIndex: wi, input: ni, errors, keystrokes, correctChars: cc, startTime: tst, charStates: ns }, players: np });
    } else {
      ns[ei] = 2;
      set({ typing: { ...T, charIndex: ei + 1, input: input + e.key, errors: errors + 1, keystrokes, startTime: tst, charStates: ns } });
    }
  },

  // ===================== BOTS =====================
  tickBots: () => {
    const s = get();
    if (s.phase !== "racing" || !s.startTime) return;
    const now = Date.now(); const el = now - s.startTime;
    let newPc = s.placementCounter;
    const np = s.players.map((p) => {
      if (p.type !== "bot" || p.finished) return p;
      const b = s.bots.find((x) => x.id === p.id);
      if (!b || b.finished) return p;
      const dt = 1 / 60, base = (b.targetWpm * 5) / 60;
      const u1 = Math.max(0.0001, Math.random()), u2 = Math.random();
      const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      b.burstTimer -= dt; let bm = 1;
      if (b.burstTimer <= 0) { b.bursting = Math.random() < 0.3; b.burstTimer = b.bursting ? 0.5 + Math.random() * 1.5 : 1 + Math.random() * 3; if (!b.bursting && Math.random() < 0.08) { b.paused = true; b.pauseUntil = now + 200 + Math.random() * 500; } }
      if (b.paused && now < b.pauseUntil) { /* skip */ } else {
        b.paused = false; if (b.bursting) bm = 1.2 + Math.random() * 0.15;
        const fat = Math.max(0.95, 1 - (el / 1000) * 0.0004);
        b.charsTyped += Math.max(0, base * (1 + noise * 0.11) * bm * fat * dt);
      }
      const prog = Math.min(1, b.charsTyped / s.text.length);
      const em = el / 6e4; const wpm = em > 0.01 ? Math.round((b.charsTyped / 5) / em) : 0;
      if (prog >= 1 && !b.finished) { b.finished = true; newPc++; return { ...p, progress: 1, wpm, finished: true, finishTime: el, placement: newPc }; }
      return { ...p, progress: prog, wpm };
    });
    set({ players: np, placementCounter: newPc });
    if (np.every((p) => p.finished)) { if (s.replayIntervalId) clearInterval(s.replayIntervalId); set({ phase: "finished" }); }
  },

  tickTimer: () => { const { startTime } = get(); if (startTime) set({ elapsed: Date.now() - startTime }); },

  finishPlayer: (id) => {
    const s = get(); const newPc = s.placementCounter + 1;
    const np = s.players.map((p) => p.id === id ? { ...p, placement: newPc, finished: true } : p);
    set({ players: np, placementCounter: newPc });
    const humansDone = np.filter((p) => p.type === "human").every((p) => p.finished);
    const allDone = np.every((p) => p.finished);
    if (allDone || humansDone) { if (s.replayIntervalId) clearInterval(s.replayIntervalId); setTimeout(() => set({ phase: "finished" }), 500); }
  },

  reset: () => {
    const { replayIntervalId, channel } = get();
    if (replayIntervalId) clearInterval(replayIntervalId);
    if (channel) channel.unsubscribe();
    set({ phase: "lobby", text: "", words: [], players: [], bots: [], typing: emptyTyping(), startTime: null, elapsed: 0, placementCounter: 0, countdown: 3, wordTimings: [], replay: [], replayIntervalId: null, roomId: null, roomCode: null, channel: null, isHost: false });
  },

  // ===================== MULTIPLAYER =====================
  broadcastProgress: () => {
    const { channel, players, playerId } = get();
    const you = players.find((p) => p.id === playerId);
    if (channel && you) {
      channel.send({ type: "broadcast", event: "progress", payload: { id: playerId, name: you.name, progress: you.progress, wpm: you.wpm, accuracy: you.accuracy, currentWord: you.currentWord, finished: you.finished, finishTime: you.finishTime, color: you.color, seed: you.seed } });
    }
  },

  createRoom: async () => {
    if (!supabase) return null;
    const s = get();
    const { data, error } = await supabase.from("race_rooms").insert({ difficulty: s.difficulty, word_count: s.wordCount, race_text: s.text, phase: "lobby" }).select("id, code").single();
    if (error || !data) { console.error("createRoom error:", error); return null; }
    const ch = getRaceChannel(data.id);
    if (ch) {
      const { playerId } = get();
      // Listen for progress from other players
      ch.on("broadcast", { event: "progress" }, ({ payload }) => {
        if (payload.id === playerId) return;
        const ps = get().players;
        const exists = ps.find((p) => p.id === payload.id);
        if (exists) set({ players: ps.map((p) => p.id === payload.id ? { ...p, ...payload } : p) });
        else set({ players: [...ps, { id: payload.id, name: payload.name, type: "human", progress: payload.progress || 0, wpm: payload.wpm || 0, accuracy: payload.accuracy || 100, currentWord: payload.currentWord || "", finished: payload.finished || false, finishTime: payload.finishTime || null, placement: null, color: payload.color || "#4a9eff", seed: payload.seed || Math.random() * 1e4 | 0 }] });
      });
      // Listen for player_joined
      ch.on("broadcast", { event: "room_event" }, ({ payload }) => {
        if (payload.event === "player_joined") {
          const ps = get().players;
          if (!ps.find((p) => p.id === payload.playerId)) {
            set({ players: [...ps, { id: payload.playerId as string, name: payload.playerName as string, type: "human", progress: 0, wpm: 0, accuracy: 100, currentWord: "", finished: false, finishTime: null, placement: null, color: "#4a9eff", seed: Math.random() * 1e4 | 0 }] });
          }
        }
      });
      await ch.subscribe();
    }
    set({ roomId: data.id, roomCode: data.code, channel: ch, isHost: true });
    return data.code;
  },

  joinRoom: async (code: string) => {
    if (!supabase) return false;
    const { data, error } = await supabase.from("race_rooms").select("*").eq("code", code.toUpperCase()).eq("phase", "lobby").single();
    if (error || !data) return false;
    const ch = getRaceChannel(data.id);
    if (ch) {
      const { playerId } = get();

      // Listen for progress
      ch.on("broadcast", { event: "progress" }, ({ payload }) => {
        if (payload.id === playerId) return;
        const ps = get().players;
        const exists = ps.find((p) => p.id === payload.id);
        if (exists) set({ players: ps.map((p) => p.id === payload.id ? { ...p, ...payload } : p) });
        else set({ players: [...ps, { id: payload.id, name: payload.name, type: "human", progress: payload.progress || 0, wpm: payload.wpm || 0, accuracy: payload.accuracy || 100, currentWord: payload.currentWord || "", finished: payload.finished || false, finishTime: payload.finishTime || null, placement: null, color: payload.color || "#4a9eff", seed: payload.seed || Math.random() * 1e4 | 0 }] });
      });

      // Listen for room events — THIS IS THE KEY PART
      ch.on("broadcast", { event: "room_event" }, ({ payload }) => {
        const s = get();

        if (payload.event === "countdown_start") {
          // Host started the race! Set up our local race with the SAME text
          get()._initParticipantRace(payload.text as string, payload.difficulty as Difficulty, payload.wordCount as number);
          set({ phase: "countdown", countdown: 3 });
        }

        if (payload.event === "countdown_tick") {
          const newCount = payload.countdown as number;
          if (newCount <= 0) {
            // GO! Start racing
            const now = Date.now();
            const bots = get().bots;
            bots.forEach((b) => (b.startTime = now));
            const rid = setInterval(() => { const st = get(); if (st.phase === "racing") st.replay.push({ time: Date.now() - (st.startTime || now), charIndex: st.typing.charIndex, states: [...st.typing.charStates] }); }, 80);
            set({ phase: "racing", countdown: 0, startTime: now, replayIntervalId: rid });
          } else {
            set({ countdown: newCount });
          }
        }

        if (payload.event === "player_joined") {
          const ps = get().players;
          if (!ps.find((p) => p.id === payload.playerId)) {
            set({ players: [...ps, { id: payload.playerId as string, name: payload.playerName as string, type: "human", progress: 0, wpm: 0, accuracy: 100, currentWord: "", finished: false, finishTime: null, placement: null, color: "#4a9eff", seed: Math.random() * 1e4 | 0 }] });
          }
        }
      });

      await ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Tell the host we joined
          ch.send({ type: "broadcast", event: "room_event", payload: { event: "player_joined", playerId: get().playerId, playerName: get().playerName.trim() || `Racer${Math.random() * 999 | 0}` } });
        }
      });
    }
    // Store room info but DON'T start race. Wait for host's countdown_start.
    set({ roomId: data.id, roomCode: data.code, channel: ch, isHost: false, difficulty: data.difficulty, wordCount: data.word_count });
    return true;
  },

  leaveRoom: () => {
    const { channel } = get();
    if (channel) channel.unsubscribe();
    set({ channel: null, roomId: null, roomCode: null, isHost: false });
  },
}));
