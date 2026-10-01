"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assistantService } from "../services/assistant.service";
import type { AssistantMessage } from "../types";

const KEY = "celebobo-assistant";

export const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant Celebobo 🤖. Posez-moi vos questions sur les produits, la commande ou la livraison.",
  createdAt: 0,
};

/** Conversation avec l'assistant : historique persisté dans sessionStorage. */
export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setMessages(JSON.parse(raw) as AssistantMessage[]);
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.map((m) => ({ ...m, animate: false }))));
    } catch {
      /* ignore */
    }
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", content, createdAt: Date.now() }]);
    setLoading(true);
    try {
      const res = await assistantService.send(content);
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: res.reply, products: res.products, createdAt: Date.now(), animate: true }]);
    } catch {
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: "Désolé, je rencontre un problème technique. Réessayez dans un instant.", createdAt: Date.now(), animate: true }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => setMessages([{ ...WELCOME, createdAt: Date.now() }]), []);

  return { messages, loading, send, reset };
}
