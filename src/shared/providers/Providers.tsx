"use client";

import { MotionConfig } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState, type ReactNode } from "react";
import { useAuth, useSessionSync } from "@/modules/auth/hooks/useAuth";
import { useRealtimeSession } from "@/shared/hooks/useRealtime";
import { ApiError } from "@/shared/lib/api";
import { Toaster } from "@/shared/ui/Toast";
import { CartOwnerSync } from "@/modules/cart/components/CartOwnerSync";
import { NavigationProgress } from "@/shared/layout/NavigationProgress";
import { AccountCompletionGate } from "@/modules/consents/components/AccountCompletionGate";
import { needsCompletion } from "@/modules/auth/types";

/**
 * Une seule nouvelle tentative, et seulement si le service se dit momentanément indisponible (503) :
 * rejouer un 4xx est inutile, et rejouer un délai dépassé ou un 502/504 surcharge un serveur déjà saturé.
 */
const retryOnce = (failures: number, error: unknown) => failures < 1 && (!(error instanceof ApiError) || error.status === 503);
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);

function SessionSync() {
  useSessionSync();
  const { user } = useAuth();
  // pas de temps réel tant que le compte n'est pas complété (l'API refuse le ticket)
  useRealtimeSession(user && !needsCompletion(user) ? user.id : null);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: retryOnce, retryDelay },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        {/* useSearchParams : Suspense pour ne pas forcer le rendu client des pages statiques */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SessionSync />
        <Suspense fallback={null}>
          <AccountCompletionGate />
        </Suspense>
        <CartOwnerSync />
        {children}
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
