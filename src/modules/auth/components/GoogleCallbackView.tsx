"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CloseCircle } from "iconsax-reactjs";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Spinner } from "@/shared/ui/Spinner";
import { toast } from "@/shared/ui/Toast";
import { useGoogleLogin } from "../hooks/useAuth";
import { consumeGoogleState } from "../lib/google";

/** Retour de Google : vérifie `state`, échange le `code` auprès de l'API puis redirige. */
export function GoogleCallbackView() {
  const params = useSearchParams();
  const router = useRouter();
  const google = useGoogleLogin();
  const started = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get("code");
    const next = consumeGoogleState(params.get("state"));
    if (params.get("error") || !code || !next) {
      setError("La connexion avec Google a été annulée ou a expiré. Réessayez.");
      return;
    }
    google.mutate(code, {
      onSuccess: (u) => {
        toast.success(`Bienvenue ${u.firstName || u.username} !`);
        router.replace(next);
      },
      onError: (e) => setError(getErrorMessage(e)),
    });
  }, [params, google, router]);

  return (
    <Block className="mx-auto max-w-[560px]">
      {error ? (
        <EmptyState
          icon={<CloseCircle size={40} variant="Bulk" />}
          title="Connexion impossible"
          description={error}
          action={<Button href={ROUTES.login()}>Retour à la connexion</Button>}
        />
      ) : (
        <div className="grid min-h-[260px] place-items-center gap-3 text-center">
          <Spinner size={28} />
          <p className="text-[14px] text-ink-2">Connexion avec Google…</p>
        </div>
      )}
    </Block>
  );
}
