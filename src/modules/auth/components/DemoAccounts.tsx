"use client";

import { Flash } from "iconsax-reactjs";
import { env } from "@/config/env";
import { DEMO_ACCOUNTS } from "../mocks/users";

/** Connexion rapide : visible UNIQUEMENT en mode mock. */
export function DemoAccounts({ onPick, disabled }: { onPick: (login: string) => void; disabled?: boolean }) {
  if (!env.USE_MOCKS) return null;
  return (
    <div className="mt-5 rounded-box border border-dashed border-primary/50 bg-primary-50 p-3.5 sm:mt-6 sm:p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase text-primary-dark"><Flash size={14} variant="Bold" /> Comptes de démonstration</p>
      <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {DEMO_ACCOUNTS.map((a) => (
          <button key={a.login} type="button" disabled={disabled} onClick={() => onPick(a.login)} className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50 sm:min-h-0 sm:px-3.5 sm:py-1.5">
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
