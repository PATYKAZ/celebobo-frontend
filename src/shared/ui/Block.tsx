import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Padding interne : "none" | "md" (30px, standard design) | "sm" (20px) */
  pad?: "none" | "sm" | "md";
  as?: "div" | "section" | "article" | "aside" | "main";
}

/** Bloc blanc standard (`wh-box`) : fond #FFF, rad 10. */
export function Block({ pad = "md", as: Tag = "div", className, ...rest }: Props) {
  return (
    <Tag
      className={cn("rounded-box bg-white", pad === "md" && "p-5 sm:p-[30px]", pad === "sm" && "p-4 sm:p-5", className)}
      {...rest}
    />
  );
}
