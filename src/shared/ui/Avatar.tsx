import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { initials } from "@/shared/lib/format";

export function Avatar({ src, name, size = 40, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-100 font-bold text-primary-dark", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" /> : initials(name) || "?"}
    </span>
  );
}
