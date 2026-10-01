"use client";

import { MotionConfig } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useSessionSync } from "@/modules/auth/hooks/useAuth";
import { Toaster } from "@/shared/ui/Toast";

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
        {children}
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
