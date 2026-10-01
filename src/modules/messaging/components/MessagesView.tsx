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

/**
 * Messagerie à deux volets. La sélection est locale (+ history.replaceState) afin d'éviter
 * le remontage de page (template) à chaque clic ; /messages/[id] ouvre directement une conversation.
 */
export function MessagesView({ initialId = null }: { initialId?: number | null }) {
  const [activeId, setActiveId] = useState<number | null>(initialId);

  const select = useCallback((id: number | null) => {
    setActiveId(id);
    window.history.replaceState(null, "", id ? ROUTES.conversation(id) : ROUTES.messages);
  }, []);

  return (
    <AuthGuard>
      <Breadcrumb items={[{ label: "Messages", href: activeId ? ROUTES.messages : undefined }, ...(activeId ? [{ label: `Discussion #${activeId}` }] : [])]} />
      <Block pad="none" className="overflow-hidden">
        <div className="grid h-[calc(100vh-120px)] min-h-[560px] max-h-[760px] lg:grid-cols-[360px_1fr]">
          <div className={cn("min-h-0 border-line-3 lg:flex lg:flex-col lg:border-r", activeId ? "hidden" : "flex flex-col")}>
            <ConversationList activeId={activeId} onSelect={select} />
          </div>
          <div className={cn("min-h-0", activeId ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
            {activeId ? (
              <ChatWindow key={activeId} conversationId={activeId} onBack={() => select(null)} className="h-full" />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <span className="mx-auto grid size-24 animate-float place-items-center rounded-full bg-primary-50 text-primary"><Messages3 size={44} variant="Bulk" /></span>
                  <h2 className="mt-5 text-[20px]">Sélectionnez une discussion</h2>
                  <p className="mx-auto mt-1 max-w-[320px] text-[14px] text-ink-2">Échangez avec nos revendeurs pour finaliser vos commandes en toute confiance.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Block>
    </AuthGuard>
  );
}
