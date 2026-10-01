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

/** Bannière photo : zoom au survol, dégradé de lisibilité, lien étiré sur toute la carte. */
export function PhotoBanner({ image, href, label, overlay = "from-black/70 via-black/30 to-transparent", direction = "r", className, contentClassName, sizes = "(min-width:1024px) 650px, 100vw", priority, children }: Props) {
  return (
    <div className={cn("group relative overflow-hidden rounded-box bg-chip", className)}>
      <Image src={image} alt="" fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
      <div className={cn("absolute inset-0", DIR[direction], overlay)} />
      <div className={cn("relative z-10 h-full", contentClassName)}>{children}</div>
      <Link href={href} aria-label={label} className="absolute inset-0 z-20" />
    </div>
  );
}
