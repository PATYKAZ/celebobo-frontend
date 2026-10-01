"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

const calc = (target: number): Countdown => {
  const diff = Math.max(0, target - Date.now());
  const s = Math.floor(diff / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: diff === 0 };
};

/** Compte à rebours vers une date cible (ms ou ISO). Initialisé à 0 côté serveur → pas de mismatch d'hydratation. */
export function useCountdown(target: number | string | Date): Countdown {
  const t = new Date(target).getTime();
  const [state, setState] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0, done: false });
  useEffect(() => {
    setState(calc(t));
    const id = setInterval(() => setState(calc(t)), 1000);
    return () => clearInterval(id);
  }, [t]);
  return state;
}
