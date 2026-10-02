"use client";

import { MotionConfig } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useSessionSync } from "@/modules/auth/hooks/useAuth";
import { Toaster } from "@/shared/ui/Toast";
import { CartOwnerSync } from "@/modules/cart/components/CartOwnerSync";

function SessionSync() {
  useSessionSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        <SessionSync />
        <CartOwnerSync />
        {children}
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
