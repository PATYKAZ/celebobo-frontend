import type { Product } from "@/modules/products/types";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  createdAt: number;
  /** true : la réponse s'affiche mot par mot (uniquement pour la réponse en cours). */
  animate?: boolean;
  /** Message d'erreur : question à renvoyer avec le bouton « Réessayer ». */
  retry?: string;
}

/** Réponse de l'assistant (texte + cartes produits liées à /produits/{slug}). */
export interface AssistantReply {
  reply: string;
  products?: Product[];
}

export const SUGGESTIONS = ["Quel smartphone choisir ?", "Comment commander ?", "Délais de livraison", "Quelles promotions en ce moment ?"];
