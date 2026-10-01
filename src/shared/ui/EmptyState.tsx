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
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-16 text-center", className)}>
      <div className="relative grid size-24 place-items-center rounded-full bg-primary-50 text-primary">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/15" />
        <span className="animate-float">{icon}</span>
      </div>
      <h3 className="mt-2 text-[20px] leading-[28px]">{title}</h3>
      {description && <p className="max-w-[420px] text-[14px] leading-[22px] text-ink-2">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
