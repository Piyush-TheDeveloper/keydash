"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { DIFFICULTIES } from "@/lib/config";
import Avatar from "./Avatar";
import Chart from "chart.js/auto";

const fmt = (ms: number) => { const s = ms / 1000; return s < 60 ? s.toFixed(2) + "s" : Math.floor(s / 60) + "m " + (s % 60).toFixed(0) + "s"; };

export default function Results() {
  const { players, text, typing, wordTimings, replay, difficulty, playerId, initLocalRace, startCountdown, reset } = useStore();
  const [mainTab, setMainTab] = useState<"summary" | "match">("match");
  const [subTab, setSubTab] = useState<"stats" | "perf" | "replay">("stats");

  const you = players.find((p) => p.id === playerId)!;
  const sorted = [...players].sort((a, b) => {
    if (a.finished && b.finished) return (a.finishTime || 1e9) - (b.finishTime || 1e9);
    if (a.finished) return -1; if (b.finished) return 1; return b.progress - a.progress;
  });
  const place = sorted.findIndex((p) => p.id === playerId) + 1;
  const diff = DIFFICULTIES.find((d) => d.key === difficulty)!;

  const again = () => { initLocalRace(false); startCountdown(); };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="bg-bg-2/65 backdrop-blur-2xl border border-bg-6/40 rounded-[20px] overflow-hidden max-w-[680px] mx-auto">
        {/* Main tabs */}
        <div className="flex justify-center gap-8 py-4 border-b border-bg-6/25">
          {(["summary", "match"] as const).map((t) => (
            <button key={t} onClick={() => setMainTab(t)} className={`text-sm font-semibold pb-1 border-b-2 transition-all capitalize tracking-[0.5px] ${mainTab === t ? "text-accent border-accent" : "text-txt-3 border-transparent hover:text-txt-2"}`}>{t}</button>
          ))}
        </div>

        {/* SUMMARY */}
        {mainTab === "summary" && (
          <div className="p-6 text-center animate-fade-up">
            <span className="text-5xl block mb-2">{place === 1 ? "🏆" : place === 2 ? "🥈" : place === 3 ? "🥉" : "🏁"}</span>
            <h2 className="text-[28px] font-extrabold text-txt-1">{{ 1: "Victory Royale!", 2: "So Close!", 3: "Strong Finish!" }[place] || "Race Complete!"}</h2>
            <p className="font-mono text-xs text-txt-3 mt-1">{["", "1st", "2nd", "3rd", "4th", "5th", "6th"][place] || place + "th"} Place · {players.length} racers</p>
            <div className="grid grid-cols-3 gap-2.5 mt-6 max-w-[360px] mx-auto">
              <StatBox label="WPM" value={String(you.wpm)} color="#e67e22" />
              <StatBox label="Accuracy" value={`${you.accuracy}%`} color="#2ecc71" />
              <StatBox label="Time" value={you.finishTime ? fmt(you.finishTime) : "DNF"} color="#4a9eff" />
            </div>
          </div>
        )}

        {/* MATCH */}
        {mainTab === "match" && (
          <div className="animate-fade-up">
            <div className="flex gap-1 p-4 pb-0">
              <div className="flex gap-1 bg-bg-6/15 rounded-[10px] p-1">
                {(["stats", "perf", "replay"] as const).map((t) => (
                  <button key={t} onClick={() => setSubTab(t)} className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-all capitalize ${subTab === t ? "text-txt-1 bg-bg-6/35" : "text-txt-3 hover:text-txt-2"}`}>
                    {t === "stats" ? "Statistics" : t === "perf" ? "Performance" : "Replay"}
                  </button>
                ))}
              </div>
            </div>

            {subTab === "stats" && <StatsPanel you={you} text={text} charStates={typing.charStates} errors={typing.errors} />}
            {subTab === "perf" && <PerfPanel wordTimings={wordTimings} />}
            {subTab === "replay" && <ReplayPanel text={text} replay={replay} />}
          </div>
        )}

        {/* Bottom racers */}
        <div className="px-5 pb-4 pt-2">
          <div className="flex justify-between items-center mb-2.5">
            <button onClick={reset} className="w-10 h-10 rounded-[10px] bg-neon-blue text-white flex items-center justify-center text-lg font-bold hover:bg-[#5ca8ff] hover:-translate-y-px transition-all">«</button>
            <button onClick={again} className="w-10 h-10 rounded-[10px] bg-neon-pink text-white flex items-center justify-center text-lg font-bold hover:bg-[#f78fc3] hover:-translate-y-px transition-all">▶</button>
          </div>
          {sorted.map((p, i) => {
            const y = p.id === playerId; const pct = Math.round(p.progress * 100);
            const rank = i + 1; // Derived from finishTime sort — same on all browsers
            const plTxt = p.finished ? (["", "🏆", "2ND", "3RD"][rank] || `${rank}TH`) : "DNF";
            return (
              <div key={p.id} className="flex items-center gap-2 p-[7px_10px] rounded-xl mb-[5px] bg-bg-1/40 border border-bg-6/15 hover:bg-bg-1/60 transition-all">
                <div className="w-8 h-8 rounded-[10px] overflow-hidden flex-shrink-0"><Avatar seed={p.seed} size={32} border={y ? "#e67e22" : p.color} /></div>
                <span className="flex-1 font-mono text-xs font-bold" style={{ color: y ? "#e67e22" : "#f0ece4" }}>{p.name}</span>
                <div className="w-[180px] h-3.5 bg-bg-1 rounded-[7px] overflow-hidden"><div className="h-full rounded-[7px]" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${p.color}66,${p.color})` }} /></div>
                <span className="font-mono text-[11px] font-bold min-w-[36px] text-center" style={{ color: rank === 1 ? "#fbbf24" : "var(--txt-2,#8a8694)" }}>{plTxt}</span>
                <span className="font-mono text-xs font-bold min-w-[80px] text-right" style={{ color: p.color }}>{p.wpm > 0 ? p.wpm.toFixed(2) : "—"} <small className="font-normal text-[9px] text-txt-g">WPM</small></span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={again} className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-accent-dark via-accent to-accent-light text-white text-sm font-bold shadow-[0_4px_20px_rgba(230,126,34,0.2)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(230,126,34,0.3)] active:scale-[0.98] transition-all">Race Again</button>
          <button onClick={reset} className="px-6 py-3.5 rounded-xl border-[1.5px] border-bg-6/40 bg-bg-3 text-txt-2 text-sm font-bold hover:border-bg-7 hover:text-txt-1 hover:bg-bg-4 active:scale-[0.98] transition-all">Change Mode</button>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-4 text-center">
      <div className="font-mono text-[10px] text-accent uppercase tracking-[2px] font-bold mb-1.5">{label}</div>
      <div className="text-[28px] font-extrabold tracking-tight" style={{ color }}>{value}</div>
    </div>
  );
}

// ===== STATISTICS TAB =====
function StatsPanel({ you, text, charStates, errors }: { you: any; text: string; charStates: number[]; errors: number }) {
  const errText = text.split("").map((ch, i) => {
    if (charStates[i] === 2) return `<span class="text-accent">${ch === " " ? "&nbsp;" : ch}</span>`;
    return ch === " " ? "&nbsp;" : ch;
  }).join("");

  return (
    <div className="p-5 pt-4 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-5">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[2px] font-bold mb-1.5">Words per minute</div>
          <div className="text-[40px] font-extrabold text-accent tracking-tight leading-none">{(you.wpm || 0).toFixed(2)}</div>
        </div>
        <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-5 col-span-1 row-span-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div><div className="font-mono text-[10px] text-accent uppercase tracking-[1.5px] font-bold">Mode</div><div className="text-[13px] font-bold uppercase tracking-[0.5px] mt-1">{useStore.getState().difficulty.toUpperCase()}</div></div>
            <div><div className="font-mono text-[10px] text-accent uppercase tracking-[1.5px] font-bold">Racer</div><div className="text-[13px] font-bold text-accent uppercase mt-1">{you.name}</div></div>
          </div>
          <div className="bg-bg/50 rounded-xl p-3.5 border border-bg-6/15 font-mono text-[13px] leading-[1.9] text-txt-2 break-words" dangerouslySetInnerHTML={{ __html: errText }} />
        </div>
        <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-5">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[2px] font-bold mb-1.5">Accuracy</div>
          <div className="text-[40px] font-extrabold text-neon-green tracking-tight leading-none">{you.accuracy}<small className="text-2xl font-bold">%</small></div>
        </div>
        <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-5">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[2px] font-bold mb-1.5">Elapsed time</div>
          <div className="text-[40px] font-extrabold text-accent tracking-tight leading-none">{you.finishTime ? fmt(you.finishTime) : "DNF"}</div>
        </div>
        <div className="bg-bg-1/60 border border-bg-6/20 rounded-2xl p-5">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[2px] font-bold mb-1.5">Mistakes</div>
          <div className="text-[40px] font-extrabold text-neon-red tracking-tight leading-none">{errors}</div>
        </div>
      </div>
    </div>
  );
}

// ===== PERFORMANCE TAB =====
function PerfPanel({ wordTimings }: { wordTimings: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const wt = wordTimings.filter((w) => w.endTime != null);
    if (wt.length < 2) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = wt.map((w) => w.word);
    const wpmData = wt.map((w) => Math.round(w.wpm * 100) / 100);
    const spwData = wt.map((w) => Math.round((w.spw || 0) * 100) / 100);
    let tc = 0; const runAvg = wt.map((w) => { tc += w.word.length; const t = (w.endTime || 0) / 1000; return t > 0 ? Math.round(((tc / 5) / (t / 60)) * 100) / 100 : 0; });

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "WPM (per word)", data: wpmData, borderColor: "#e67e22", backgroundColor: "#e67e2233", borderWidth: 2, pointBackgroundColor: "#e67e22", pointRadius: 4, pointHoverRadius: 6, tension: 0.3, yAxisID: "y" },
          { label: "Seconds per word", data: spwData, borderColor: "#4a9eff", backgroundColor: "transparent", borderWidth: 0, pointBackgroundColor: "#4a9eff", pointRadius: 3.5, pointHoverRadius: 5, showLine: false, yAxisID: "y1" },
          { label: "Running avg WPM", data: runAvg, borderColor: "#e67e2288", backgroundColor: "transparent", borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.4, yAxisID: "y" },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "rgba(19,19,29,0.95)", borderColor: "rgba(48,48,62,0.4)", borderWidth: 1, titleFont: { family: "JetBrains Mono", size: 11 }, bodyFont: { family: "JetBrains Mono", size: 11 }, padding: 10, cornerRadius: 8 },
        },
        scales: {
          x: { ticks: { color: "#5a5768", font: { family: "JetBrains Mono", size: 10 }, maxRotation: 45 }, grid: { color: "rgba(48,48,62,0.15)" } },
          y: { position: "left", title: { display: true, text: "Words Per Minute", color: "#e67e22", font: { family: "JetBrains Mono", size: 10 } }, ticks: { color: "#e67e22", font: { family: "JetBrains Mono", size: 10 } }, grid: { color: "rgba(48,48,62,0.12)" }, min: Math.max(0, Math.min(...wpmData) - 15) },
          y1: { position: "right", title: { display: true, text: "Seconds Per Word", color: "#4a9eff", font: { family: "JetBrains Mono", size: 10 } }, ticks: { color: "#4a9eff", font: { family: "JetBrains Mono", size: 10 } }, grid: { display: false }, min: 0 },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [wordTimings]);

  return (
    <div className="p-5 pt-4 animate-fade-up">
      <div className="relative w-full h-[320px] bg-bg/50 border border-bg-6/15 rounded-2xl p-4">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ===== REPLAY TAB =====
function ReplayPanel({ text, replay }: { text: string; replay: any[] }) {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const speeds = [0.5, 1, 2, 4];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderFrame = useCallback((i: number) => {
    if (!replay.length) return "";
    const snap = replay[Math.min(i, replay.length - 1)];
    return text.split("").map((ch, ci) => {
      let cls = "";
      if (snap.states[ci] === 1) cls = " rok"; else if (snap.states[ci] === 2) cls = " rer";
      if (ci === snap.charIndex) cls += " rcur";
      return `<span class="rch${cls}">${ch === " " ? "&nbsp;" : ch}</span>`;
    }).join("");
  }, [text, replay]);

  const step = useCallback(() => {
    if (!playing) return;
    setIdx((prev) => {
      const next = prev + 1;
      if (next >= replay.length) { setPlaying(false); return prev; }
      const dt = replay[next] ? (replay[next].time - replay[prev].time) / speed : 80;
      timerRef.current = setTimeout(step, Math.max(10, dt));
      return next;
    });
  }, [playing, replay, speed]);

  useEffect(() => { if (playing) step(); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [playing, step]);

  const toggle = () => {
    if (playing) { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); }
    else { if (idx >= replay.length - 1) setIdx(0); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setIdx(Math.round(pct * (replay.length - 1)));
  };

  const snap = replay[Math.min(idx, replay.length - 1)];
  const time = snap ? (snap.time / 1000).toFixed(1) : "0.0";
  const pct = replay.length > 1 ? (idx / (replay.length - 1)) * 100 : 0;

  return (
    <div className="p-5 pt-4 animate-fade-up">
      <div className="font-mono text-sm leading-[2] text-txt-2 break-words bg-bg/50 rounded-xl p-4 border border-bg-6/15 min-h-[80px] mb-3.5 [&_.rch]:transition-colors [&_.rch]:duration-[50ms] [&_.rok]:text-txt-1 [&_.rer]:text-neon-red [&_.rer]:bg-neon-red/10 [&_.rer]:rounded-sm [&_.rcur]:relative [&_.rcur]:before:content-[''] [&_.rcur]:before:absolute [&_.rcur]:before:left-0 [&_.rcur]:before:top-[2px] [&_.rcur]:before:bottom-[2px] [&_.rcur]:before:w-[2px] [&_.rcur]:before:bg-neon-blue [&_.rcur]:before:rounded-[1px] [&_.rcur]:before:shadow-[0_0_6px_rgba(74,158,255,0.6)]"
        dangerouslySetInnerHTML={{ __html: renderFrame(idx) }} />
      <div className="flex items-center gap-3">
        <button onClick={toggle} className={`w-10 h-10 rounded-[10px] text-white flex items-center justify-center text-base transition-all hover:-translate-y-px ${playing ? "bg-accent" : "bg-neon-blue"}`}>
          {playing ? "⏸" : "▶"}
        </button>
        <div className="flex-1 h-1 bg-bg-5 rounded-sm relative cursor-pointer" onClick={seek}>
          <div className="h-full bg-neon-blue rounded-sm" style={{ width: `${pct}%`, transition: "width 50ms linear" }} />
        </div>
        <span className="font-mono text-[11px] text-txt-3 min-w-[40px] text-right">{time}s</span>
        <button onClick={() => { const si = (speeds.indexOf(speed) + 1) % speeds.length; setSpeed(speeds[si]); }}
          className="font-mono text-[11px] text-txt-3 px-2.5 py-1 rounded-md border border-bg-6 hover:text-txt-1 hover:border-bg-7 transition-all">
          {speed}x
        </button>
      </div>
    </div>
  );
}
