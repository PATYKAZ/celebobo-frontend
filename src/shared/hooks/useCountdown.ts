"use client";

import { useSyncExternalStore } from "react";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

// une horloge à la seconde partagée par tous les comptes à rebours de la page
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverSeconds = () => null;

/** Compte à rebours vers une date cible (ms ou ISO). À 0 au rendu serveur → pas d'écart d'hydratation. */
export function useCountdown(target: number | string | Date): Countdown {
  const now = useSyncExternalStore(subscribe, nowSeconds, serverSeconds);
  if (now == null) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  const s = Math.max(0, Math.floor(new Date(target).getTime() / 1000) - now);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: s === 0 };
}
