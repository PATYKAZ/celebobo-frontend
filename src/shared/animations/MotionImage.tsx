"use client";

import Image, { type ImageProps } from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** Image qui zoome lentement (Ken Burns) — slides du hero. `active` relance l'animation. */
export function KenBurnsImage({ active = true, className, alt, ...rest }: ImageProps & { active?: boolean }) {
  return (
    <Image
      alt={alt}
      className={cn("object-cover will-change-transform", active ? "animate-ken-burns" : "scale-100", className)}
      {...rest}
    />
  );
}

/** Image à parallaxe verticale selon le scroll (se déplace plus lentement que la page). */
export function ParallaxImage({ strength = 40, className, wrapperClassName, alt, ...rest }: ImageProps & { strength?: number; wrapperClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={cn("relative overflow-hidden", wrapperClassName)}>
      <motion.div style={{ y, scale: 1.2 }} className="absolute inset-0">
        <Image alt={alt} className={cn("object-cover", className)} {...rest} />
      </motion.div>
    </div>
  );
}

/** Carte qui s'incline en 3D selon la position de la souris (+ reflet). */
export function TiltCard({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  const glow = useTransform([px, py], ([x, y]) => `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,.28), transparent 55%)`);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      className={cn("relative", className)}
    >
      {children}
      <motion.span aria-hidden style={{ background: glow }} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [div:hover>&]:opacity-100" />
    </motion.div>
  );
}

/** Élément qui flotte doucement (produits héros). */
export function Float({ children, className, slow }: { children: ReactNode; className?: string; slow?: boolean }) {
  return <div className={cn(slow ? "animate-float-slow" : "animate-float", className)}>{children}</div>;
}

/** Bande défilante infinie (logos de marques). Le contenu est dupliqué pour la boucle. */
export function Marquee({ children, className, pauseOnHover = true }: { children: ReactNode; className?: string; pauseOnHover?: boolean }) {
  return (
    <div className={cn("group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]", className)}>
      {[0, 1].map((i) => (
        <div key={i} aria-hidden={i === 1} className={cn("flex min-w-full shrink-0 animate-marquee items-center justify-around gap-10 pr-10", pauseOnHover && "group-hover:[animation-play-state:paused]")}>
          {children}
        </div>
      ))}
    </div>
  );
}
