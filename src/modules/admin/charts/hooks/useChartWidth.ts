"use client";

import { useEffect, useRef, useState } from "react";

/** Largeur réelle d'un conteneur (ResizeObserver) pour des SVG responsives. */
export function useChartWidth<T extends HTMLElement = HTMLDivElement>(initial = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || initial);
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return { ref, width };
}
