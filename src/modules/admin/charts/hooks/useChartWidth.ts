"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Largeur réelle d'un conteneur (ResizeObserver) pour des SVG responsives.
 * La valeur initiale est volontairement petite (mobile) : un SVG plus large que son conteneur
 * ferait grossir la cellule de grille/flex parente avant la première mesure.
 */
export function useChartWidth<T extends HTMLElement = HTMLDivElement>(initial = 300) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.max(200, el.clientWidth || initial));
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return { ref, width };
}
