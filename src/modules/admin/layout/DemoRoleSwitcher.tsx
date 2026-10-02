"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown2, Eye } from "iconsax-reactjs";
import { env } from "@/config/env";
import { Popover } from "@/shared/ui/Popover";
import { toast } from "@/shared/ui/Toast";
import { DEMO_ACCOUNTS } from "@/modules/auth/mocks/users";
import { ROLE_LABEL } from "@/modules/auth/permissions";
import { useAuthStore } from "@/modules/auth/store/auth.store";

/** (mode mock uniquement) Change de rôle d'un clic pour tester les permissions sans se déconnecter. */
export function DemoRoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  if (!env.USE_MOCKS || !user) return null;

  return (
    <Popover
      align="right"
      panelClassName="w-[230px]"
      triggerClassName="flex h-10 items-center gap-2 rounded-full border border-dashed border-primary/50 bg-primary-50 px-3 text-[12px] font-bold text-primary-dark hover:bg-primary-100"
      trigger={
        <>
          <Eye size={15} variant="Bold" /> Vue : {ROLE_LABEL[user.role]} <ArrowDown2 size={11} />
        </>
      }
    >
      {(close) => (
        <div>
          <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">Tester en tant que</p>
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.login}
              onClick={() => {
                setUser(a.user);
                qc.invalidateQueries();
                toast.info(`Connecté en tant que ${ROLE_LABEL[a.user.role]}`);
                close();
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[13px] font-semibold hover:bg-chip ${a.user.id === user.id ? "text-primary" : ""}`}
            >
              {a.label}
              {a.user.id === user.id && <span className="size-2 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
