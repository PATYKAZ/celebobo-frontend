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

        <button onClick={() => copy(code, `Code ${code}`)} className="group mt-4 flex w-full items-center justify-between rounded-box border border-dashed border-primary/50 bg-primary-50 px-4 py-3 transition-colors hover:bg-primary-100" aria-label="Copier le code">
          <span className="text-[30px] font-extrabold leading-[36px] tracking-[0.3em] text-primary-dark">{code || "—"}</span>
          <Copy size={20} className="text-primary transition-transform group-hover:scale-110" />
        </button>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid size-[116px] shrink-0 place-items-center rounded-box bg-white p-2 ring-1 ring-line-3">
            {link ? <QRCodeSVG value={link} size={100} level="M" fgColor="#139713" /> : <span className="size-[100px] animate-pulse rounded bg-chip" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate rounded-md bg-chip px-3 py-2 text-[12px] text-ink-2" title={link}>{link || "…"}</p>
            <div className="flex gap-2">
              <button onClick={() => link && copy(link, "Lien d'invitation copié")} disabled={!link} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-chip text-[12px] font-bold transition-colors hover:bg-primary hover:text-white disabled:opacity-50">
                <Link21 size={15} /> Copier
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!link}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#25D366] text-[12px] font-bold text-white transition-opacity hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <Whatsapp size={15} variant="Bold" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Block>
    </Reveal>
  );
}
