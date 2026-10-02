import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Diamètre en px (design : 40 header, 35 social, 30 wishlist). */
  size?: number;
  tone?: "chip" | "chip2" | "chip3" | "social" | "wish" | "white" | "primary" | "dark";
  href?: string;
  label: string;
  children: ReactNode;
  active?: boolean;
}

const TONES = {
  chip: "bg-chip text-ink",
  chip2: "bg-chip-2 text-ink",
  chip3: "bg-chip-3 text-ink",
  social: "bg-chip-social text-ink",
  wish: "bg-page text-ink-3",
  white: "bg-white text-ink",
  primary: "bg-primary text-white",
  dark: "bg-ink-dark text-white",
};

/** Rond d'icône (boutons du header, réseaux sociaux, wishlist…). */
export function CircleButton({ size = 40, tone = "chip", href, label, children, className, active, ...rest }: Props) {
  const cls = cn(
    "relative inline-grid shrink-0 place-items-center rounded-full transition-all duration-300 before:absolute before:-inset-1 before:content-[''] hover:-translate-y-0.5 hover:bg-primary hover:text-white active:scale-90",
    TONES[tone],
    active && "!bg-primary !text-white",
    className,
  );
  const style = { width: size, height: size };
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} title={label} className={cls} style={style} {...rest}>
      {children}
    </button>
  );
}
