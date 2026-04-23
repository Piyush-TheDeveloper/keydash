"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";

export default function Countdown() {
  const phase = useStore((s) => s.phase);
  const countdown = useStore((s) => s.countdown);
  if (phase !== "countdown") return null;
  const isGo = countdown === 0;
  const color = isGo ? "#2ecc71" : "#e67e22";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-bg/[0.88] backdrop-blur-[14px]">
      <div className="relative flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.span key={countdown} initial={{ scale: 0.4, opacity: 0, filter: "blur(8px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} exit={{ scale: 2, opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold text-[130px] leading-none" style={{ color, textShadow: `0 0 50px ${color}88` }}>
            {isGo ? "GO" : countdown}
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-xs text-txt-3 mt-3.5 tracking-[2px] uppercase">{isGo ? "Type!" : "Get ready..."}</span>
        {[0, 1, 2].map((i) => <motion.div key={`r${i}${countdown}`} className="absolute rounded-full" style={{ border: `1px solid ${color}1a` }} initial={{ width: 80, height: 80, opacity: 0.5 }} animate={{ width: 450 + i * 80, height: 450 + i * 80, opacity: 0 }} transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }} />)}
      </div>
    </motion.div>
  );
}
