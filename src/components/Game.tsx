"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useGameLoop, useKeyboard, useCountdownTimer } from "@/hooks/useGame";
import Lobby from "./Lobby";
import Countdown from "./Countdown";
import RaceHUD from "./RaceHUD";
import RaceTrack from "./RaceTrack";
import TypingDisplay from "./TypingDisplay";
import Results from "./Results";

export default function Game() {
  const phase = useStore((s) => s.phase);
  const reset = useStore((s) => s.reset);
  useGameLoop();
  useKeyboard();
  useCountdownTimer();

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* BG effects */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.012]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
      <div className="fixed top-[-25%] left-[-15%] w-[700px] h-[700px] rounded-full bg-accent/[0.025] blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-25%] right-[-15%] w-[600px] h-[600px] rounded-full bg-neon-purple/[0.02] blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-5">
        {(phase === "racing" || phase === "countdown") && (
          <div className="flex items-center justify-between mb-2">
            <button onClick={reset} className="flex items-center gap-1 text-accent font-mono text-xs font-bold hover:text-accent-light transition-colors group">
              <span className="group-hover:-translate-x-0.5 transition-transform">«</span> LEAVE
            </button>
            <div className="font-bold text-sm tracking-tight">KEY<span className="text-accent">DASH</span></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "lobby" && <motion.div key="lobby" exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}><Lobby /></motion.div>}
          {(phase === "countdown" || phase === "racing") && (
            <motion.div key="race" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RaceHUD />
              <RaceTrack />
              <TypingDisplay />
            </motion.div>
          )}
          {phase === "finished" && <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Results /></motion.div>}
        </AnimatePresence>
      </div>
      {phase === "countdown" && <Countdown />}
    </div>
  );
}
