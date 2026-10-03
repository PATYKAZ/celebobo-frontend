"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { assistantService } from "../services/assistant.service";
import type { AssistantMessage } from "../types";

const KEY = "celebobo-assistant";
const SESSION_KEY = "celebobo-assistant-session";

export const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant Celebobo 🤖. Posez-moi vos questions sur les produits, la commande ou la livraison.",
  createdAt: 0,
};

const readSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
const writeSession = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};

/** Une seule ouverture de session à la fois (page /assistant et bulle flottante partagent la même). */
let opening: Promise<string> | null = null;
function ensureSession(): Promise<string> {
  const id = readSession();
  if (id) return Promise.resolve(id);
  opening ??= assistantService
    .open()
    .then((sid) => {
      writeSession(sid);
      return sid;
    })
    .finally(() => {
      opening = null;
    });
  return opening;
}

/** Conversation avec l'assistant (API `/assistant/sessions/`) : session et historique conservés dans sessionStorage. */
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
      let session = await ensureSession();
      const res = await assistantService.ask(session, content).catch(async (e) => {
        // session expirée ou appartenant à un autre compte : on en ouvre une nouvelle
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
        writeSession(null);
        session = await ensureSession();
        return assistantService.ask(session, content);
      });
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: res.reply, products: res.products, createdAt: Date.now(), animate: true }]);
    } catch (e) {
      const detail = e instanceof ApiError && e.status !== 0 && e.status < 500 ? getErrorMessage(e) : "Désolé, je rencontre un problème technique. Réessayez dans un instant.";
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: detail, createdAt: Date.now(), animate: true }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    const session = readSession();
    writeSession(null);
    if (session) assistantService.close(session).catch(() => {});
    setMessages([{ ...WELCOME, createdAt: Date.now() }]);
  }, []);

  return { messages, loading, send, reset };
}
