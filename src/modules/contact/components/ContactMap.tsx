"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Location, Routing } from "@/shared/ui/icons";
import { SITE } from "@/config/site";
import { useSiteSettings } from "@/modules/site";

/**
 * Plan de la page Contact : carte Google Maps intégrée (gratuite, sans clé), centrée sur l'adresse saisie dans
 * le back-office (Réglages du site) — elle suit donc toute correction d'adresse. Seule une adresse précise
 * (rue, quartier, ville) place l'épingle au bon endroit ; « Bukavu · Goma » tombe au milieu du lac Kivu.
 * Sans adresse : carte décorative.
 */
export function ContactMap() {
  const { address } = useSiteSettings();
  const query = address.join(", ").trim();
  const [loaded, setLoaded] = useState(false);
  if (!query) return <DecorativeMap address={address} />;
  const encoded = encodeURIComponent(query);

  return (
    // mobile : carte puis encadré (la carte reste dégagée) ; desktop : encadré en haut à droite, hors des commandes Google
    <div className="overflow-hidden rounded-box bg-surface sm:relative">
      <div className="relative h-[300px] bg-mint sm:h-[420px]">
        {!loaded && <div className="skeleton absolute inset-0 rounded-none!" aria-hidden />}
        <iframe
          title={`Plan d'accès : ${query}`}
          src={`https://maps.google.com/maps?q=${encoded}&hl=fr&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 size-full border-0"
          allowFullScreen
        />
      </div>
      <div className="p-4 sm:absolute sm:right-4 sm:top-4 sm:max-w-[340px] sm:rounded-box sm:bg-surface sm:shadow-[0_8px_30px_rgba(0,0,0,.12)]">
        <p className="flex items-center gap-2 text-[14px] font-bold"><Location size={18} variant="Bold" className="text-primary" /> {SITE.name} Business</p>
        <p className="mt-1 text-[13px] leading-[19px] text-ink-2">{query}</p>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-primary hover:underline">
          <Routing size={16} /> Itinéraire
        </a>
      </div>
    </div>
  );
}

/** Carte décorative (SVG pur, sans service externe) quand aucune adresse n'est renseignée. */
function DecorativeMap({ address }: { address: string[] }) {
  return (
    <div className="relative h-[280px] overflow-hidden rounded-box bg-chip sm:h-[400px]">
      <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="blocks" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="6" y="6" width="68" height="68" rx="8" fill="#fff" opacity=".55" />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#blocks)" />
        <path d="M-20 300 C 150 250, 260 360, 420 300 S 700 230, 830 280 L 830 330 C 700 280, 560 360, 420 345 S 130 300, -20 350 Z" fill="#BFE0F5" opacity=".9" />
        {[
          "M0 120 H800", "M0 220 H800", "M180 0 V400", "M520 0 V400",
        ].map((d) => <path key={d} d={d} stroke="#fff" strokeWidth="14" />)}
        <path d="M0 40 L 800 160" stroke="#FFE08A" strokeWidth="10" />
        <circle cx="610" cy="90" r="46" fill="#ECF8F6" />
        <circle cx="120" cy="170" r="30" fill="#ECF8F6" />
      </svg>
      <div className="absolute left-[56%] top-[44%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-full size-14 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full bg-primary/40" />
        <motion.div initial={{ y: -60, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.3 }} className="relative -translate-y-1/2">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-white ring-4 ring-white"><Location size={24} variant="Bold" /></span>
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-box bg-surface p-4 sm:right-auto sm:max-w-[320px]">
        <p className="text-[14px] font-bold">{SITE.name} Business</p>
        <p className="mt-0.5 text-[13px] text-ink-2">{address.join(", ")}</p>
        <a href={`https://www.google.com/maps/search/${encodeURIComponent(address.join(", "))}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center text-[13px] font-bold text-primary hover:underline">Itinéraire →</a>
      </div>
    </div>
  );
}
