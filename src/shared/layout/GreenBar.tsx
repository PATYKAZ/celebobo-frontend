"use client";

import { Refresh2, ShieldTick, Truck } from "iconsax-reactjs";
import { formatPrice } from "@/shared/lib/format";
import { useSiteSettings } from "@/modules/site";
import { SearchBar } from "./SearchBar";

/** Barre verte `nav-style3` : recherche à gauche + 3 arguments à droite (1300×75, #1ABA1A, rad 10). */
export function GreenBar() {
  const { freeThreshold } = useSiteSettings().shipping;
  const perks = [
    { icon: Truck, label: freeThreshold !== null ? `Livraison offerte dès ${formatPrice(freeThreshold).replace(/\.00$/, "")}` : "Livraison rapide" },
    { icon: Refresh2, label: "Retour sous 7 jours" },
    { icon: ShieldTick, label: "Paiement mobile sécurisé" },
  ];
  return (
    <div className="mt-px rounded-box bg-primary px-4 py-3 max-lg:-mx-[15px] max-lg:rounded-none max-lg:px-[19px] sm:px-[30px] lg:py-[15px]">
      <div className="flex flex-col gap-4 lg:h-[45px] lg:flex-row lg:items-center lg:justify-between">
        <SearchBar className="w-full lg:w-[517px]" />
        <ul className="hidden items-center gap-8 text-[13px] font-medium uppercase leading-[19.5px] text-white xl:flex">
          {perks.map(({ icon: Icon, label }) => (
            <li key={label} className="group flex items-center gap-2">
              <Icon size={18} variant="Bold" className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
