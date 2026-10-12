"use client";

import { useRef, useState } from "react";
import { Gallery, Trash } from "@/shared/ui/icons";
import { sendUpload } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import type { ImageSlotValue } from "../types";

interface Props {
  label: string;
  value: ImageSlotValue;
  onChange: (v: ImageSlotValue) => void;
  main?: boolean;
  error?: string;
}

/**
 * Emplacement d'image : clic ou glisser-déposer, aperçu immédiat, suppression. Le fichier est réduit et
 * envoyé à Cloudinary dès son choix : « Enregistrer » n'attend plus les images.
 */
export function ImageSlot({ label, value, onChange, main, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [sending, setSending] = useState<Promise<unknown> | null>(null);

  const take = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (value.url?.startsWith("blob:")) URL.revokeObjectURL(value.url);
    const upload = sendUpload(file, "product_image");
    // un échec ici est retenté à l'enregistrement : pas d'erreur non gérée
    const settled = upload.then(
      () => undefined,
      () => undefined,
    );
    setSending(settled);
    settled.then(() => setSending((p) => (p === settled ? null : p)));
    onChange({ file, url: URL.createObjectURL(file), upload });
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
          main ? "aspect-square" : "aspect-4/3",
          drag ? "scale-[1.02] border-primary bg-primary-50" : error ? "border-danger bg-danger-50" : "border-line bg-page/40 hover:border-primary",
        )}
      >
        {value.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt={label} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
            {sending && (
              <span role="status" className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-2 shadow-sm">
                <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" aria-hidden />
                Envoi…
              </span>
            )}
            <button
              type="button"
              aria-label="Retirer l'image"
              onClick={(e) => {
                e.stopPropagation();
                setSending(null);
                onChange({ url: null, file: null });
              }}
              className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-white text-danger shadow-sm transition-opacity hover:bg-danger hover:text-white active:scale-90 sm:size-8 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-ink-3 transition-colors group-hover:text-primary">
            <Gallery size={main ? 34 : 26} variant="Bulk" />
            <span className="text-[12px] leading-[16px]"><span className="sm:hidden">Touchez pour ajouter</span><span className="hidden sm:inline">Cliquez ou déposez une image</span></span>
          </div>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p role="alert" className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
