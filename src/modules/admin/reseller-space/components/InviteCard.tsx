"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy, Link21, Whatsapp } from "iconsax-reactjs";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { toast } from "@/shared/ui/Toast";

/** Lien d'invitation partageable : le code est pré-rempli à l'inscription (`?ref=`). */
export function useInviteLink(code: string) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin && code ? `${origin}${ROUTES.register}?ref=${code}` : "";
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copié", what);
  } catch {
    toast.error("Copie impossible", "Sélectionnez le texte manuellement.");
  }
}

/** Code d'invitation + lien + QR code + partage WhatsApp. */
export function InviteCard({ code, invitedCount }: { code: string; invitedCount?: number }) {
  const link = useInviteLink(code);
  const message = `Rejoignez Celebobo avec mon code revendeur ${code} : ${link}`;

  return (
    <Reveal>
      <Block pad="sm" className="overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,rgba(26,186,26,.09),transparent_60%),#fff]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold leading-[22px]">Mon code d'invitation</h2>
            <p className="text-[12px] text-ink-3">{invitedCount != null ? `${invitedCount} client${invitedCount > 1 ? "s" : ""} invité${invitedCount > 1 ? "s" : ""}` : "Partagez-le pour gagner des commissions"}</p>
          </div>
        </div>

        <button onClick={() => copy(code, `Code ${code}`)} className="group mt-4 flex min-h-16 w-full items-center justify-between rounded-box border border-dashed border-primary/50 bg-primary-50 px-4 py-3 transition-all hover:bg-primary-100 active:scale-[0.985]" aria-label="Copier le code">
          <span className="text-[32px] font-extrabold leading-[38px] tracking-[0.3em] text-primary-dark">{code || "—"}</span>
          <Copy size={20} className="text-primary transition-transform group-hover:scale-110" />
        </button>

        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <div className="grid aspect-square w-[min(200px,62vw)] shrink-0 place-items-center rounded-box bg-white p-3 ring-1 ring-line-3 sm:size-[116px] sm:w-[116px] sm:p-2">
            {link ? <QRCodeSVG value={link} size={256} level="M" fgColor="#139713" className="h-full w-full" /> : <span className="size-full animate-pulse rounded bg-chip" />}
          </div>
          <div className="w-full min-w-0 flex-1 space-y-2.5 sm:space-y-2">
            <p className="truncate rounded-md bg-chip px-3 py-2.5 text-center text-[12px] text-ink-2 sm:text-left" title={link}>{link || "…"}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => link && copy(link, "Lien d'invitation copié")} disabled={!link} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-box bg-chip text-[13px] font-bold transition-all hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50 sm:h-9 sm:rounded-md sm:text-[12px]">
                <Link21 size={16} /> Copier
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!link}
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-box bg-[#25D366] text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:h-9 sm:rounded-md sm:text-[12px]"
              >
                <Whatsapp size={16} variant="Bold" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Block>
    </Reveal>
  );
}
