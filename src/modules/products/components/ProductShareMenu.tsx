"use client";

import { Copy, Link21, Share, Whatsapp } from "iconsax-reactjs";
import { Popover } from "@/shared/ui/Popover";
import { toast } from "@/shared/ui/Toast";

interface Props {
  name: string;
  /** URL à partager (défaut : page courante) */
  url?: string;
}

/** Menu « Partager » : WhatsApp, copier le lien, partage natif du téléphone si disponible. */
export function ProductShareMenu({ name, url }: Props) {
  const href = () => url ?? (typeof window !== "undefined" ? window.location.href : "");
  const text = () => `Regarde ce produit sur Celebobo : ${name}`;
  const item = "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-chip hover:text-primary";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href());
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: name, text: text(), url: href() });
    } catch {
      /* partage annulé */
    }
  };

  return (
    <Popover
      align="right"
      label="Partager ce produit"
      panelClassName="w-[230px]"
      triggerClassName="grid size-[45px] place-items-center rounded-box bg-chip transition-colors hover:bg-primary hover:text-white"
      trigger={<Share size={19} />}
    >
      {(close) => (
        <div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text()}\n${href()}`)}`} target="_blank" rel="noopener noreferrer" onClick={close} className={item}>
            <Whatsapp size={18} variant="Bold" color="#25D366" /> WhatsApp
          </a>
          <button
            onClick={() => {
              copy();
              close();
            }}
            className={item}
          >
            <Copy size={18} /> Copier le lien
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={() => {
                nativeShare();
                close();
              }}
              className={item}
            >
              <Link21 size={18} /> Autres applications…
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}
