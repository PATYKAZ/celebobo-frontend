import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:py-16", className)}>
      <div className="relative grid size-20 place-items-center sm:size-24 rounded-full bg-primary-50 text-primary">
        {/* deux pulsations à l'apparition, puis immobile : un état vide n'a pas à s'agiter en continu */}
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/15 [animation-iteration-count:2]" />
        <span className="animate-pop">{icon}</span>
      </div>
      <h2 className="mt-2 text-lg">{title}</h2>
      {description && <p className="max-w-[420px] text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
