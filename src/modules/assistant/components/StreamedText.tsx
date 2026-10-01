"use client";

import { useEffect, useState } from "react";

/** Affiche le texte mot par mot (effet « streaming »). `onTick` permet de scroller pendant l'animation. */
export function StreamedText({ text, animate, onTick }: { text: string; animate?: boolean; onTick?: () => void }) {
  const words = text.split(" ");
  const [count, setCount] = useState(animate ? 0 : words.length);

  useEffect(() => {
    if (!animate) return;
    if (count >= words.length) return;
    const t = setTimeout(() => {
      setCount((c) => c + 1);
      onTick?.();
    }, 28);
    return () => clearTimeout(t);
  }, [animate, count, words.length, onTick]);

  return <span className="whitespace-pre-wrap">{words.slice(0, count).join(" ")}</span>;
}
