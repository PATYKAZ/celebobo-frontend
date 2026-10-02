"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { ArrowDown2, MagicStar } from "iconsax-reactjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { AssistantPanel } from "./AssistantPanel";

const KEY = "celebobo-assistant-fab";
const HINT_KEY = "celebobo-assistant-hint";
const SIZE = 56;
const MARGIN = 12;

/** Pages où le bouton est masqué (l'assistant y est déjà plein écran, ou un flux critique est en cours). */
const HIDDEN = (p: string) => p === "/assistant" || p === "/commande" || p.startsWith("/messages/");

type Side = "l" | "r";

/**
 * Bouton flottant de l'assistant : GLISSABLE (drag), il se colle au bord gauche/droit le plus proche à
 * la fin du geste et mémorise sa position. Un simple appui ouvre la bulle de chat
 * (feuille ancrée en bas sur mobile, fenêtre flottante sur ordinateur).
 * Il reste toujours au-dessus de la barre d'onglets mobile et des barres d'achat collantes.
 */
export function AssistantLauncher() {
  const pathname = usePathname();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const anchor = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragged = useRef(false);
  const [side, setSide] = useState<Side>("r");
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  /** Limites de déplacement par rapport à l'ancrage par défaut (bas droite). */
  const measure = useCallback(() => {
    const el = anchor.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const vv = window.visualViewport;
    const vw = vv?.width ?? window.innerWidth;
    const top = 72; // laisse l'en-tête visible
    const b = { left: -(r.left - MARGIN), right: Math.max(0, vw - MARGIN - r.right), top: -(r.top - top), bottom: 0 };
    return { r, vw, b };
  }, []);

  // restaure la position mémorisée ; recalcule les limites au redimensionnement
  useEffect(() => {
    const apply = () => {
      const m = measure();
      if (!m) return;
      setBounds(m.b);
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { side: Side; y: number } | null;
        if (saved) {
          setSide(saved.side);
          x.set(saved.side === "l" ? m.b.left : 0);
          y.set(Math.min(m.b.bottom, Math.max(m.b.top, saved.y)));
        } else {
          y.set(Math.min(m.b.bottom, Math.max(m.b.top, y.get())));
        }
      } catch {
        /* position par défaut */
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [measure, x, y, desktop]);

  // bulle d'accroche (une fois par session)
  useEffect(() => {
    if (HIDDEN(pathname)) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(HINT_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t1 = setTimeout(() => setHint(true), 3500);
    const t2 = setTimeout(() => {
      setHint(false);
      try {
        sessionStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 11000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  const onDragEnd = () => {
    setDragging(false);
    const m = measure();
    if (!m) return;
    // position réelle de la pastille après le geste
    const cx = m.r.left + x.get() + SIZE / 2;
    const toLeft = cx < m.vw / 2;
    const newSide: Side = toLeft ? "l" : "r";
    const targetX = toLeft ? m.b.left : 0;
    animate(x, targetX, { type: "spring", stiffness: 420, damping: 32 });
    const targetY = Math.min(m.b.bottom, Math.max(m.b.top, y.get()));
    animate(y, targetY, { type: "spring", stiffness: 420, damping: 32 });
    setSide(newSide);
    try {
      localStorage.setItem(KEY, JSON.stringify({ side: newSide, y: targetY }));
    } catch {
      /* ignore */
    }
    // laisse « click » (déclenché après un drag) être ignoré
    setTimeout(() => (dragged.current = false), 60);
  };

  const toggle = () => {
    if (dragged.current) return;
    setHint(false);
    setOpen((o) => !o);
  };

  if (HIDDEN(pathname)) return null;

  return (
    <>
      {/* ancrage : bas droite, au-dessus de la barre d'onglets / barre d'achat (mobile) et du bouton « haut de page » (desktop) */}
      <div
        ref={anchor}
        className="pointer-events-none fixed right-4 z-[60] bottom-[calc(var(--tabbar-h)+var(--buybar-h,0px)+16px)] lg:right-5 lg:bottom-[92px]"
        style={{ width: SIZE, height: SIZE }}
      >
        <motion.div
          drag
          dragConstraints={bounds}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x, y, touchAction: "none" }}
          onDragStart={() => {
            dragged.current = true;
            setDragging(true);
            setHint(false);
          }}
          onDragEnd={onDragEnd}
          className="pointer-events-auto relative size-full"
        >
          {/* bulle d'accroche */}
          <AnimatePresence>
            {hint && !open && !dragging && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={toggle}
                className={cn(
                  "absolute bottom-[calc(100%+10px)] w-max max-w-[220px] rounded-2xl bg-white px-4 py-2.5 text-left text-[13px] font-semibold leading-[18px] shadow-[0_10px_30px_rgba(0,0,0,.18)]",
                  side === "r" ? "right-0 rounded-br-md" : "left-0 rounded-bl-md",
                )}
              >
                Besoin d&apos;aide ? <span className="font-normal text-ink-2">Je peux vous conseiller 👋</span>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={toggle}
            aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant Celebobo"}
            aria-expanded={open}
            whileTap={{ scale: 0.92 }}
            animate={{ scale: dragging ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className={cn(
              "relative grid size-full place-items-center rounded-full bg-[linear-gradient(145deg,#27d427,#139713)] text-white shadow-[0_8px_26px_rgba(26,186,26,.5)] outline-none",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            {!open && !dragging && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />}
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <ArrowDown2 size={26} variant="Bold" />
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="animate-float-slow">
                  <MagicStar size={28} variant="Bold" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="absolute right-0.5 top-0.5 size-3.5 rounded-full bg-sun ring-2 ring-white" />
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile : feuille ancrée en bas */}
      {!desktop && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Assistant Celebobo" maxVh={88} className="h-[min(86dvh,720px)]">
          <AssistantPanel className="-mx-5 h-full max-h-[calc(86dvh-70px)]" onNavigate={() => setOpen(false)} />
        </BottomSheet>
      )}

      {/* Desktop : fenêtre flottante près du bouton */}
      <AnimatePresence>
        {desktop && open && (
          <motion.div
            role="dialog"
            aria-label="Assistant Celebobo"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={cn(
              "fixed bottom-[168px] z-[61] flex h-[min(560px,calc(100dvh-210px))] w-[390px] flex-col overflow-hidden rounded-box bg-white shadow-[0_20px_60px_rgba(0,0,0,.28)]",
              side === "r" ? "right-5" : "left-5",
            )}
          >
            <AssistantPanel showHeader onClose={() => setOpen(false)} onNavigate={() => setOpen(false)} className="h-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
