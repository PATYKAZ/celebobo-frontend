// Généré par scripts/generate-icons.mjs — ne pas modifier.
import { createElement, forwardRef, type ReactNode, type SVGAttributes } from "react";

export type IconVariant = "Linear" | "Bold" | "Bulk";

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  variant?: IconVariant;
  color?: string;
  size?: string | number;
}

export type Icon = ReturnType<typeof icon>;

/** Composant d'icône Iconsax (mêmes props que iconsax-reactjs), limité aux variantes utilisées par le site. */
export function icon(name: string, variants: Record<IconVariant, (color: string) => ReactNode>) {
  const Component = forwardRef<SVGSVGElement, IconProps>(function Icon({ variant = "Linear", color = "currentColor", size = 24, ...rest }, ref) {
    return createElement("svg", { ...rest, ref, xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none" }, (variants[variant] ?? variants.Linear)(color));
  });
  Component.displayName = name;
  return Component;
}
