"use client";

import { animate, useInView, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface Props {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Formatage personnalisé (ex: formatPrice). Prioritaire sur decimals/prefix/suffix. */
  format?: (n: number) => string;
}

/** Nombre qui s'anime de `from` à `to` quand il devient visible. */
export function CountUp({ to, from = 0, duration = 1.6, decimals = 0, prefix = "", suffix = "", className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(from);
  const text = useTransform(mv, (v) =>
    format ? format(v) : `${prefix}${v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{text}</motion.span>
    </span>
  );
}
