"use client";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

export function useGameLoop() {
  const phase = useStore((s) => s.phase);
  const tickBots = useStore((s) => s.tickBots);
  const tickTimer = useStore((s) => s.tickTimer);
  const raf = useRef(0);
  useEffect(() => {
    if (phase !== "racing") return;
    const loop = () => { tickBots(); tickTimer(); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, tickBots, tickTimer]);
}

export function useKeyboard() {
  const phase = useStore((s) => s.phase);
  const handleKey = useStore((s) => s.handleKey);
  useEffect(() => {
    if (phase !== "racing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Backspace") e.preventDefault();
      handleKey(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleKey]);
}

export function useCountdownTimer() {
  const phase = useStore((s) => s.phase);
  const countdown = useStore((s) => s.countdown);
  const dec = useStore((s) => s.decrementCountdown);
  useEffect(() => {
    if (phase !== "countdown") return;
    const iv = setInterval(dec, 1000);
    return () => clearInterval(iv);
  }, [phase, countdown, dec]);
}
