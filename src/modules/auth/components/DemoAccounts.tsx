"use client";

import { Flash } from "iconsax-reactjs";
import { env } from "@/config/env";
import { DEMO_ACCOUNTS } from "../mocks/users";

/** Connexion rapide : visible UNIQUEMENT en mode mock. */
export function DemoAccounts({ onPick, disabled }: { onPick: (login: string) => void; disabled?: boolean }) {
  if (!env.USE_MOCKS) return null;
  return (
    <div className="mt-6 rounded-box border border-dashed border-primary/50 bg-primary-50 p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase text-primary-dark"><Flash size={14} variant="Bold" /> Comptes de démonstration</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((a) => (
          <button key={a.login} type="button" disabled={disabled} onClick={() => onPick(a.login)} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-primary hover:text-white disabled:opacity-50">
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
