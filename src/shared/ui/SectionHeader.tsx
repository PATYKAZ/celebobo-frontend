import Link from "next/link";
import { ArrowRight2 } from "iconsax-reactjs";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  title: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Slot à droite (flèches de carrousel, filtres…) */
  right?: ReactNode;
  /** Variante sur fond vert (barre « Deals of the day ») */
  onPrimary?: boolean;
  className?: string;
}

/** Titre de section (18/21.6 uppercase) + lien « Voir tout › ». */
export function SectionHeader({ title, viewAllHref, viewAllLabel = "Voir tout", right, onPrimary, className }: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-6">
        <h2 className={cn("truncate text-section uppercase", onPrimary && "text-white")}>{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className={cn("group hidden items-center gap-0.5 text-link capitalize sm:inline-flex", onPrimary ? "text-white" : "text-ink-2 hover:text-primary")}
          >
            {viewAllLabel}
            <ArrowRight2 size={13} variant="Bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      {right}
    </div>
  );
}
