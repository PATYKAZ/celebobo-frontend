"use client";

import { useRef, useState } from "react";
import { Gallery, Trash } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import type { ImageSlotValue } from "../types";

interface Props {
  label: string;
  value: ImageSlotValue;
  onChange: (v: ImageSlotValue) => void;
  main?: boolean;
  error?: string;
}

/** Emplacement d'image : clic ou glisser-déposer, aperçu immédiat, suppression. */
export function ImageSlot({ label, value, onChange, main, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const take = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (value.url?.startsWith("blob:")) URL.revokeObjectURL(value.url);
    onChange({ file, url: URL.createObjectURL(file) });
  };

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold">{label}{main && <span className="ml-0.5 text-danger">*</span>}</p>
      <div
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        aria-label={`Choisir : ${label}`}
        className={cn(
          "group relative grid cursor-pointer place-items-center overflow-hidden rounded-box border-2 border-dashed transition-all",
          main ? "aspect-square" : "aspect-[4/3]",
          drag ? "scale-[1.02] border-primary bg-primary-50" : error ? "border-danger bg-danger-50" : "border-line bg-page/40 hover:border-primary",
        )}
      >
        {value.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt={label} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
            <button
              type="button"
              aria-label="Retirer l'image"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ url: null, file: null });
              }}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white text-danger opacity-0 transition-opacity hover:bg-danger hover:text-white group-hover:opacity-100"
            >
              <Trash size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-ink-3 transition-colors group-hover:text-primary">
            <Gallery size={main ? 34 : 26} variant="Bulk" />
            <span className="text-[12px] leading-[16px]">Cliquez ou déposez une image</span>
          </div>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p role="alert" className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
