"use client";

import { useEffect, useState } from "react";

export interface VisualViewportBox {
  height: number;
  top: number;
}

/**
 * Boîte du viewport VISUEL (réduite quand le clavier mobile s'ouvre) — sert à ancrer le chat plein écran :
 * la zone de saisie reste collée au-dessus du clavier. Retourne `null` sur desktop (≥ 1024 px) ou si l'API est absente.
 */
export function useVisualViewport(): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      if (!mq.matches || !vv) return setBox(null);
      setBox((prev) => {
        const next = { height: Math.round(vv.height), top: Math.round(vv.offsetTop) };
        return prev && prev.height === next.height && prev.top === next.top ? prev : next;
      });
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    mq.addEventListener("change", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return box;
}
