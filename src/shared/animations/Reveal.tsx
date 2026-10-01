"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 36 },
  right: { x: -36 },
  none: {},
};

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  /** Ne joue l'animation qu'une fois (défaut). */
  once?: boolean;
  /** Fraction visible avant déclenchement. */
  amount?: number;
}

/** Apparition (fade + translation) quand l'élément entre dans le viewport. */
export function Reveal({ children, direction = "up", delay = 0, duration = 0.65, once = true, amount = 0.15, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...OFFSET[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const item: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** Conteneur dont les enfants `<RevealItem>` apparaissent en cascade. */
export function RevealGroup({ children, stagger = 0.08, delay = 0, amount = 0.1, ...rest }: Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode; stagger?: number; delay?: number; amount?: number }) {
  return (
    <motion.div variants={container(stagger, delay)} initial="hidden" whileInView="show" viewport={{ once: true, amount }} {...rest}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...rest }: Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode }) {
  return (
    <motion.div variants={item} {...rest}>
      {children}
    </motion.div>
  );
}
