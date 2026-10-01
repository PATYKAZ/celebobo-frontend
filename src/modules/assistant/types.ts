import type { Product } from "@/modules/products/types";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  createdAt: number;
  /** true : la réponse s'affiche mot par mot (uniquement pour la réponse en cours). */
  animate?: boolean;
}

/** Réponse de POST ENDPOINTS.assistant.message */
export interface AssistantReply {
  reply: string;
  products?: Product[];
}

export const SUGGESTIONS = ["Quel smartphone choisir ?", "Comment commander ?", "Délais de livraison", "Quelles promotions en ce moment ?"];
