"use client";
import { useRef, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";

export default function TypingDisplay() {
  const text = useStore((s) => s.text);
  const charStates = useStore((s) => s.typing.charStates);
  const charIndex = useStore((s) => s.typing.charIndex);
  const phase = useStore((s) => s.phase);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boxRef.current) return;
    const cur = boxRef.current.querySelector("[data-cur]");
    if (cur) {
      const cr = cur.getBoundingClientRect(), br = boxRef.current.getBoundingClientRect();
      if (cr.top < br.top + 15 || cr.bottom > br.bottom - 15) cur.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [charIndex]);

  const chars = useMemo(() => text.split("").map((ch, i) => {
    const st = charStates[i];
    const isCur = i === charIndex && phase === "racing";
    let cls = "text-txt-g";
    let bg = "";
    if (st === 1) cls = "text-txt-1";
    else if (st === 2) { cls = "text-neon-red"; bg = "bg-neon-red/10 rounded-sm"; }
    return (
      <span key={i} data-cur={isCur || undefined} className={`relative inline transition-colors duration-[30ms] ${cls} ${bg}`}>
        {isCur && <span className="absolute left-0 top-[2px] bottom-[2px] w-[2.5px] bg-accent rounded-[1px] shadow-[0_0_8px_rgba(230,126,34,0.7)] animate-cursor-blink" />}
        {ch === " " ? "\u00A0" : ch}
      </span>
    );
  }), [text, charStates, charIndex, phase]);

  return (
    <div className="relative mb-1.5">
      <div className="absolute -inset-1.5 bg-accent/[0.03] rounded-[22px] blur-[20px] pointer-events-none" />
      <div ref={boxRef} className="relative bg-bg-1/[0.85] backdrop-blur-lg border border-bg-6/25 rounded-2xl px-6 py-5 max-h-[170px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <div className="font-mono text-[15px] leading-[2.2] tracking-[0.025em] select-none break-words">{chars}</div>
      </div>
      {phase === "racing" && <p className="text-center mt-1.5 font-mono text-[9px] text-txt-g tracking-[1.5px] uppercase">start typing · press space between words</p>}
    </div>
  );
}
