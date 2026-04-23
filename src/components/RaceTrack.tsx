"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";

export default function RaceTrack() {
  const players = useStore((s) => s.players);
  const playerId = useStore((s) => s.playerId);
  const sorted = [...players].sort((a, b) => b.progress - a.progress);
  return (
    <div className="bg-bg/65 border border-bg-4/35 rounded-2xl p-2.5 mb-3">
      {sorted.map((p, i) => {
        const y = p.id === playerId, pct = Math.max(1, Math.round(p.progress * 100));
        const grad = y ? "linear-gradient(90deg,#c96a15,#e67e22,#f0923a)" : `linear-gradient(90deg,${p.color}77,${p.color})`;
        const sh = pct > 5 ? `0 0 10px ${y ? "rgba(230,126,34,0.35)" : p.color + "33"}` : "none";
        const plTxt = p.placement ? (["", "1ST", "2ND", "3RD"][p.placement] || `${p.placement}TH`) : "";
        return (
          <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-[10px] mb-[5px] last:mb-0 transition-colors ${y ? "bg-accent/[0.035] border border-accent/10" : ""}`}>
            <div className="min-w-[95px] flex items-center gap-[7px]">
              <Avatar seed={p.seed} size={26} border={y ? "#e67e22" : p.color} />
              <div className="flex flex-col">
                <span className="font-mono text-[11px] font-bold max-w-[72px] truncate" style={{ color: y ? "#e67e22" : p.color }}>{y ? "YOU" : p.name}</span>
                {p.currentWord && !p.finished && <span className="font-mono text-[9px] text-txt-g max-w-[72px] truncate">{p.currentWord}</span>}
              </div>
            </div>
            <div className="flex-1 h-5 bg-bg-1 rounded-[10px] relative overflow-hidden">
              <div className="h-full rounded-[10px] flex items-center justify-end pr-[2px] relative" style={{ width: `${pct}%`, background: grad, boxShadow: sh, transition: "width 0.1s linear", minWidth: 20 }}>
                {pct > 3 && !p.finished && <div className="absolute right-0 top-0 bottom-0 w-3.5 rounded-r-[10px]" style={{ background: `linear-gradient(90deg,transparent,${y ? "#f0923a" : p.color})`, filter: "blur(3px)", opacity: 0.5 }} />}
                <span className="text-[11px] relative z-[1]">{p.finished ? "🏁" : y ? "🏎️" : "🤖"}</span>
              </div>
            </div>
            {plTxt && <span className="font-mono text-[10px] font-bold min-w-[30px] text-center" style={{ color: p.placement === 1 ? "#fbbf24" : p.color }}>{plTxt}</span>}
            <div className="min-w-[68px] text-right font-mono text-[11px] font-bold" style={{ color: y ? "#e67e22" : p.color }}>
              {p.wpm > 0 ? p.wpm.toFixed(p.wpm >= 100 ? 0 : 1) : "—"}<small className="font-normal text-[9px] text-txt-g ml-0.5">WPM</small>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
