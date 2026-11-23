"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gift } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { campaignConditions, campaignHeadline, type Campaign } from "./types";

export const cagnotteKeys = { current: ["cagnotte", "current"] as const };

/** L'opération Cagnotte en cours (programme de fidélité) : rien s'il n'y en a pas. */
export function useCurrentCampaign() {
  return useQuery({
    queryKey: cagnotteKeys.current,
    queryFn: async () => (await api.get<{ campaign: Campaign | null }>(ENDPOINTS.cagnotte.current)).campaign,
    staleTime: 5 * 60_000,
  });
}

/** Bandeau de l'accueil : l'opération, ses dates et ses conditions (Code du numérique, art. 67). */
export function CagnotteBanner() {
  const { data: campaign } = useCurrentCampaign();
  const [open, setOpen] = useState(false);
  if (!campaign) return null;
  return (
    <section aria-label="Opération Cagnotte" className="rounded-lg border border-primary/20 bg-primary-50 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Gift size={28} variant="Bold" className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-primary">Cagnotte · {campaign.name}</p>
          <p className="text-base font-bold sm:text-lg">{campaignHeadline(campaign)}</p>
          <p className="text-sm text-ink-2">Du {formatDate(campaign.startsAt)} au {formatDate(campaign.endsAt)}</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-h-11 text-sm font-semibold text-primary underline-offset-2 hover:underline">
          {open ? "Masquer les conditions" : "Voir les conditions"}
        </button>
      </div>
      {open && (
        <div className="mt-3 border-t border-primary/15 pt-3 text-sm text-ink-2">
          {campaign.description && <p className="mb-2 whitespace-pre-line">{campaign.description}</p>}
          <ul className="list-disc space-y-1 pl-5">
            {campaignConditions(campaign).map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
