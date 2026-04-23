"use client";
import { useStore } from "@/lib/store";
import { DIFFICULTIES } from "@/lib/config";

export default function RaceHUD() {
  const { elapsed, players, difficulty, phase, playerId } = useStore();
  const you = players.find((p) => p.id === playerId);
  const diff = DIFFICULTIES.find((d) => d.key === difficulty)!;
  const s = Math.floor(elapsed / 1000), m = Math.floor(s / 60);
  const ts = `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const acc = you?.accuracy ?? 100;
  const accColor = acc >= 95 ? "var(--neon-green,#2ecc71)" : acc >= 85 ? "#e67e22" : "#e74c3c";

  return (
    <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1.5">
      <div className="flex flex-col gap-px">
        <div className="font-bold text-[13px] text-txt-1 flex items-center gap-2">
          FREE FOR ALL
          <span className="font-mono text-[9px] font-bold px-2.5 py-[3px] rounded-[10px] uppercase tracking-[0.5px]" style={{ color: diff.color, background: diff.glow, border: `1px solid ${diff.color}30` }}>{diff.label.toUpperCase()}</span>
        </div>
        <span className="font-mono text-[10px] text-txt-g uppercase tracking-[1.5px]">Public lobby</span>
      </div>
      <div className="flex gap-[5px]">
        {[{ l: "WPM", v: String(you?.wpm ?? 0), c: "#e67e22" }, { l: "ACC", v: `${acc}%`, c: accColor }, { l: "TIME", v: ts }].map((s) => (
          <div key={s.l} className="bg-bg-1/[0.85] border border-bg-6/25 rounded-lg px-2.5 py-[5px] flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-txt-g tracking-[0.5px]">{s.l}</span>
            <span className="font-mono text-xs font-bold" style={{ color: s.c || "#f0ece4" }}>{s.v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /><span className="font-mono text-[10px] text-txt-3">{80 + Math.floor(Math.random() * 120)}ms</span></div>
        <span className="font-bold text-[13px]" style={{ color: diff.color }}>{players.length} PLAYERS</span>
      </div>
    </div>
  );
}
