"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/shared/ui/Spinner";
import { useAuth } from "@/modules/auth/hooks/useAuth";

/**
 * Pages boutique /messages et /notifications : l'équipe (revendeur, responsable, admin) est renvoyée
 * vers l'équivalent du back-office (même navigation, même mise en page). Les clients restent sur la boutique.
 */
export function StaffRedirect({ to, children }: { to: string; children: ReactNode }) {
  const router = useRouter();
  const { isStaff } = useAuth();

  useEffect(() => {
    if (isStaff) router.replace(to);
  }, [isStaff, to, router]);

  if (isStaff) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-box bg-white">
        <Spinner size={28} />
      </div>
    );
  }
  return <>{children}</>;
}
