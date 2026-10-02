"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  image: string;
  href: string;
  label: string;
  overlay?: string;
  /** direction du dégradé */
  direction?: "r" | "t" | "b" | "l";
  className?: string;
  contentClassName?: string;
  sizes?: string;
  priority?: boolean;
  children?: ReactNode;
}

const DIR = { r: "bg-gradient-to-r", l: "bg-gradient-to-l", t: "bg-gradient-to-t", b: "bg-gradient-to-b" };

/**
 * Bannière photo : zoom au survol, dégradé de lisibilité, lien étiré sur toute la carte.
 * Mobile : voile sombre uniforme (photo non délavée) et textes « sombres » forcés en blanc.
 */
export function PhotoBanner({ image, href, label, overlay = "from-black/70 via-black/30 to-transparent", direction = "r", className, contentClassName, sizes = "(min-width:1024px) 650px, 100vw", priority, children }: Props) {
  return (
    <div className={cn("group relative overflow-hidden rounded-box bg-chip", className)}>
      <Image src={image} alt="" fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
      <div className={cn("absolute inset-0 hidden sm:block", DIR[direction], overlay)} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10 sm:hidden" />
      <div className={cn("relative z-10 h-full max-sm:[&_.text-ink-2]:!text-white/80 max-sm:[&_.text-ink-3]:!text-white/70 max-sm:[&_.text-ink]:!text-white", contentClassName)}>{children}</div>
      <Link href={href} aria-label={label} className="absolute inset-0 z-20 active:bg-black/10" />
    </div>
  );
}
