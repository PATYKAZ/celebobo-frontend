"use client";

import { useCallback, useSyncExternalStore } from "react";
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

/**
 * Conversation partagée par la bulle et la page /assistant (un seul état, persisté dans sessionStorage).
 * Lue via useSyncExternalStore : rendu serveur et hydratation sur le message d'accueil, puis l'historique
 * du navigateur — sans écraser celui-ci au montage (l'ancien effet d'écriture enregistrait l'accueil
 * par-dessus l'historique ; ouvrir le plein écran ou recharger effaçait la conversation).
 */
interface ConversationState {
  messages: AssistantMessage[];
  loading: boolean;
}

const SERVER_STATE: ConversationState = { messages: [WELCOME], loading: false };
let state: ConversationState | null = null;
const listeners = new Set<() => void>();

function load(): ConversationState {
  if (state) return state;
  let messages: AssistantMessage[] = [WELCOME];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) messages = JSON.parse(raw) as AssistantMessage[];
  } catch {
    /* stockage indisponible : conversation en mémoire seulement */
  }
  state = { messages, loading: false };
  return state;
}

function update(patch: (s: ConversationState) => Partial<ConversationState>) {
  const current = load();
  state = { ...current, ...patch(current) };
  if (state.messages !== current.messages) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state.messages.map((m) => ({ ...m, animate: false }))));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const push = (message: AssistantMessage) => update((s) => ({ messages: [...s.messages, message] }));

/** Conversation avec l'assistant (API `/assistant/sessions/`) : session et historique conservés dans sessionStorage. */
export function useAssistant() {
  const { messages, loading } = useSyncExternalStore(subscribe, load, () => SERVER_STATE);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || load().loading) return;
    push({ id: `u${Date.now()}`, role: "user", content, createdAt: Date.now() });
    update(() => ({ loading: true }));
    try {
      let session = await ensureSession();
      const res = await assistantService.ask(session, content).catch(async (e) => {
        // session expirée ou appartenant à un autre compte : on en ouvre une nouvelle
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
        writeSession(null);
        session = await ensureSession();
        return assistantService.ask(session, content);
      });
      push({ id: `a${Date.now()}`, role: "assistant", content: res.reply, products: res.products, createdAt: Date.now(), animate: true });
    } catch (e) {
      const detail = e instanceof ApiError && e.status !== 0 && e.status < 500 ? getErrorMessage(e) : "Désolé, je rencontre un problème technique. Réessayez dans un instant.";
      push({ id: `a${Date.now()}`, role: "assistant", content: detail, createdAt: Date.now(), animate: true });
    } finally {
      update(() => ({ loading: false }));
    }
  }, []);

  const reset = useCallback(() => {
    const session = readSession();
    writeSession(null);
    if (session) assistantService.close(session).catch(() => {});
    update(() => ({ messages: [{ ...WELCOME, createdAt: Date.now() }] }));
  }, []);

  return { messages, loading, send, reset };
}
