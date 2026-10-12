"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

/**
 * Markdown minimal des réponses du modèle (gras, italique, listes à puces ou numérotées, paragraphes).
 * Construit des éléments React — jamais de HTML injecté. Un `**` encore ouvert pendant l'animation reste
 * affiché tel quel jusqu'à ce que sa fermeture arrive.
 */
function inline(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={`${key}-${i}`} className="font-bold">{part.slice(2, -2)}</strong>;
    if (/^\*[^*\s][^*]*\*$/.test(part)) return <em key={`${key}-${i}`}>{part.slice(1, -1)}</em>;
    return <Fragment key={`${key}-${i}`}>{part}</Fragment>;
  });
}

const BULLET = /^\s*[*\-•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

function blocks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const ordered = NUMBER.test(line);
    if (ordered || BULLET.test(line)) {
      const marker = ordered ? NUMBER : BULLET;
      const items: ReactNode[] = [];
      for (; i < lines.length && marker.test(lines[i]); i++) items.push(<li key={i}>{inline(lines[i].replace(marker, ""), `l${i}`)}</li>);
      i--;
      out.push(
        ordered ? (
          <ol key={`b${i}`} className="list-decimal space-y-1 pl-5">{items}</ol>
        ) : (
          <ul key={`b${i}`} className="list-disc space-y-1 pl-5 marker:text-primary">{items}</ul>
        ),
      );
    } else {
      out.push(<p key={`b${i}`}>{inline(line, `p${i}`)}</p>);
    }
  }
  return out;
}

/** Affiche la réponse mot par mot (effet « streaming »), mise en forme. `onTick` permet de scroller pendant l'animation. */
export function StreamedText({ text, animate, onTick }: { text: string; animate?: boolean; onTick?: () => void }) {
  // découpe en conservant les retours à la ligne, pour que les listes se forment au fil de l'animation
  const words = text.split(/(?<=\s)/);
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

  return <div className="space-y-2 wrap-break-word">{blocks(words.slice(0, count).join(""))}</div>;
}
