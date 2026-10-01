import { cn } from "@/shared/lib/cn";

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      role="status"
      aria-label="Chargement"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin text-primary", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
