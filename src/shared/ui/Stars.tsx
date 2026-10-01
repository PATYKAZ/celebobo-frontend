import { Star1 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";

interface Props {
  rating: number | null | undefined;
  size?: number;
  count?: number | null;
  className?: string;
  /** Masquer le compteur « (152) » */
  hideCount?: boolean;
}

/** 5 étoiles #FFA500 (vide #999) avec remplissage fractionnaire + « (152) ». */
export function Stars({ rating, size = 13, count, className, hideCount }: Props) {
  const value = Math.max(0, Math.min(5, rating ?? 0));
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={rating != null ? `Note ${rating} sur 5` : "Pas encore noté"}>
      <div className="flex gap-[2px]">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star1 size={size} variant="Bold" color="#C9CBD3" className="absolute inset-0" />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star1 size={size} variant="Bold" color="#FFA500" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {!hideCount && count != null && <span className="text-[13px] leading-[19.5px] text-ink-2">({count})</span>}
    </div>
  );
}
