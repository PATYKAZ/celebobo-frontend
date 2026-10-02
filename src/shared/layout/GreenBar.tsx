"use client";

import { Refresh2, ShieldTick, Truck } from "iconsax-reactjs";
import { SearchBar } from "./SearchBar";

const PERKS = [
  { icon: Truck, label: "Livraison offerte dès $199" },
  { icon: Refresh2, label: "Retour sous 30 jours" },
  { icon: ShieldTick, label: "Paiement mobile sécurisé" },
];

/** Barre verte `nav-style3` : recherche à gauche + 3 arguments à droite (1300×75, #1ABA1A, rad 10). */
export function GreenBar() {
  return (
    <div className="mt-px rounded-box bg-primary px-4 py-3 max-lg:-mx-[15px] max-lg:rounded-none max-lg:px-[19px] sm:px-[30px] lg:py-[15px]">
      <div className="flex flex-col gap-4 lg:h-[45px] lg:flex-row lg:items-center lg:justify-between">
        <SearchBar className="w-full lg:w-[517px]" />
        <ul className="hidden items-center gap-8 text-[13px] font-medium uppercase leading-[19.5px] text-white xl:flex">
          {PERKS.map(({ icon: Icon, label }) => (
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
