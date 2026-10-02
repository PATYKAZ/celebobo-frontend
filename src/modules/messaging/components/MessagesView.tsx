"use client";

import { Messages3 } from "iconsax-reactjs";
import { useCallback, useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useVisualViewport } from "../hooks/useVisualViewport";
import { ChatWindow } from "./ChatWindow";
import { ConversationList } from "./ConversationList";

interface Props {
  initialId?: number | null;
  /** Intégré au back-office : pas de fil d'Ariane, boîte de réception équipe, routes /admin/messages */
  embedded?: boolean;
}

/**
 * Messagerie.
 *  - Desktop (≥ lg) : deux volets (liste | discussion).
 *  - Mobile : deux ÉCRANS — la liste (dans la page), puis la discussion en PLEIN ÉCRAN (fixe, ancrée au viewport visuel
 *    pour que le clavier ne cache pas la zone de saisie). `← Retour` revient à la liste.
 * La sélection est locale (+ history.replaceState) afin d'éviter le remontage de page (template) à chaque clic ;
 * /messages/[id] et /admin/messages/[id] ouvrent directement une conversation.
 */
export function MessagesView({ initialId = null, embedded }: Props) {
  const [activeId, setActiveId] = useState<number | null>(initialId);
  const base = embedded ? ROUTES.admin.inbox : ROUTES.messages;
  const one = embedded ? ROUTES.admin.conversation : ROUTES.conversation;
  const vv = useVisualViewport();

  const select = useCallback(
    (id: number | null) => {
      setActiveId(id);
      window.history.replaceState(null, "", id ? one(id) : base);
    },
    [base, one],
  );

  // Chat plein écran sur mobile : on fige le défilement de la page derrière.
  useEffect(() => {
    if (!activeId || !vv) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeId, vv]);

  const fullScreen = !!activeId;
  const body = (
    <Block pad="none" className="max-lg:overflow-visible max-lg:rounded-box lg:overflow-hidden">
      <div className={cn("lg:grid lg:min-h-[560px] lg:grid-cols-[360px_1fr]", embedded ? "lg:h-[calc(100vh-150px)]" : "lg:h-[calc(100vh-120px)] lg:max-h-[760px]")}>
        <div className={cn("min-h-0 border-line-3 lg:flex lg:flex-col lg:border-r", activeId ? "hidden" : "block")}>
          <ConversationList activeId={activeId} onSelect={select} inbox={embedded} />
        </div>
        <div className={cn("min-h-0", activeId ? "block" : "hidden lg:flex lg:flex-col")}>
          {activeId ? (
            <div
              className={cn("flex min-h-0 flex-col bg-white", fullScreen && "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[60] max-lg:h-dvh lg:h-full")}
              style={vv ? { top: vv.top, height: vv.height } : undefined}
            >
              <ChatWindow key={activeId} conversationId={activeId} onBack={() => select(null)} className="h-full min-h-0 flex-1" />
            </div>
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-24 animate-float place-items-center rounded-full bg-primary-50 text-primary"><Messages3 size={44} variant="Bulk" /></span>
                <h2 className="mt-5 text-[20px]">Sélectionnez une discussion</h2>
                <p className="mx-auto mt-1 max-w-[320px] text-[14px] text-ink-2">
                  {embedded ? "Répondez aux clients, proposez un prix final et suivez les commandes en direct." : "Échangez avec nos revendeurs pour finaliser vos commandes en toute confiance."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Block>
  );

  return (
    <AuthGuard>
      {!embedded && (
        <div className="hidden lg:block">
          <Breadcrumb items={[{ label: "Messages", href: activeId ? ROUTES.messages : undefined }, ...(activeId ? [{ label: `Discussion #${activeId}` }] : [])]} />
        </div>
      )}
      {body}
    </AuthGuard>
  );
}
