"use client";

import { Messages3 } from "iconsax-reactjs";
import { useCallback, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { ChatWindow } from "./ChatWindow";
import { ConversationList } from "./ConversationList";

interface Props {
  initialId?: number | null;
  /** Intégré au back-office : pas de fil d'Ariane, boîte de réception équipe, routes /admin/messages */
  embedded?: boolean;
}

/**
 * Messagerie à deux volets. La sélection est locale (+ history.replaceState) afin d'éviter
 * le remontage de page (template) à chaque clic ; /messages/[id] ouvre directement une conversation.
 */
export function MessagesView({ initialId = null, embedded }: Props) {
  const [activeId, setActiveId] = useState<number | null>(initialId);
  const base = embedded ? ROUTES.admin.inbox : ROUTES.messages;
  const one = embedded ? ROUTES.admin.conversation : ROUTES.conversation;

  const select = useCallback(
    (id: number | null) => {
      setActiveId(id);
      window.history.replaceState(null, "", id ? one(id) : base);
    },
    [base, one],
  );

  const body = (
    <Block pad="none" className="overflow-hidden">
      <div className={cn("grid min-h-[560px] lg:grid-cols-[360px_1fr]", embedded ? "h-[calc(100vh-150px)]" : "h-[calc(100vh-120px)] max-h-[760px]")}>
        <div className={cn("min-h-0 border-line-3 lg:flex lg:flex-col lg:border-r", activeId ? "hidden" : "flex flex-col")}>
          <ConversationList activeId={activeId} onSelect={select} inbox={embedded} />
        </div>
        <div className={cn("min-h-0", activeId ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
          {activeId ? (
            <ChatWindow key={activeId} conversationId={activeId} onBack={() => select(null)} className="h-full" />
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
      {!embedded && <Breadcrumb items={[{ label: "Messages", href: activeId ? ROUTES.messages : undefined }, ...(activeId ? [{ label: `Discussion #${activeId}` }] : [])]} />}
      {body}
    </AuthGuard>
  );
}
