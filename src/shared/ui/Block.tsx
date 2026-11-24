import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Padding interne : "none" | "md" (20 px, standard) | "sm" (16–20 px) */
  pad?: "none" | "sm" | "md";
  as?: "div" | "section" | "article" | "aside" | "main";
}

/** Bloc blanc standard (`wh-box`) : fond #FFF, rad 10. */
export function Block({ pad = "md", as: Tag = "div", className, ...rest }: Props) {
  return (
    <Tag
      className={cn("rounded-box bg-surface", pad === "md" && "p-4 sm:p-5", pad === "sm" && "p-4 sm:p-5", className)}
      {...rest}
    />
  );
}
