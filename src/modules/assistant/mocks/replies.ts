import type { ProductListParams } from "@/modules/products/types";

export interface MockRule {
  match: RegExp;
  reply: string;
  /** Si défini, des produits sont suggérés avec ces critères. */
  products?: ProductListParams;
}

export const MOCK_RULES: MockRule[] = [
  { match: /\b(bonjour|salut|hello|bonsoir|coucou)\b/i, reply: "Bonjour ! 👋 Je suis l'assistant Celebobo. Je peux vous conseiller un produit, vous expliquer comment commander ou vous renseigner sur la livraison. Que cherchez-vous ?" },
  { match: /(smartphone|téléphone|telephone|iphone|xiaomi|portable)/i, reply: "Pour un smartphone, tout dépend de votre usage : photo, jeux ou budget serré. Voici quelques modèles populaires chez nous, tous garantis 12 mois :", products: { search: "smartphone", ordering: "-sales", pageSize: 3 } },
  { match: /(ordinateur|laptop|macbook|pc\b|dell)/i, reply: "Pour travailler ou créer, privilégiez un ordinateur avec au moins 16 Go de RAM et un SSD. Mes suggestions du moment :", products: { category: 2, ordering: "-rating", pageSize: 3 } },
  { match: /(casque|audio|écouteur|ecouteur|enceinte|musique)/i, reply: "Côté audio, nous avons des casques à réduction de bruit, des écouteurs sans fil et des enceintes étanches. Regardez plutôt :", products: { category: 4, ordering: "-sales", pageSize: 3 } },
  { match: /(gaming|jeu|jeux|console|manette|ps4|souris)/i, reply: "Pour le gaming, consoles et périphériques sont disponibles. Voici une sélection :", products: { category: 6, ordering: "-rating", pageSize: 3 } },
  { match: /(promo|solde|réduction|reduction|remise|pas cher|bon plan)/i, reply: "Voici les meilleures promotions actuellement en cours 🔥 Les prix barrés sont déjà remisés :", products: { onSale: true, ordering: "-sales", pageSize: 3 } },
  { match: /(commander|commande|acheter|achat|panier)/i, reply: "C'est simple : 1) ajoutez vos produits au panier, 2) validez la commande — une discussion s'ouvre automatiquement avec notre équipe, 3) un revendeur confirme la disponibilité et le paiement (Orange Money, Airtel Money, M-Pesa ou cash), 4) vous êtes livré. Le détail est dans le guide d'achat." },
  { match: /(livraison|délai|delai|livrer|expédition|expedition)/i, reply: "Livraison sous 24 à 48 h à Kinshasa après confirmation avec le revendeur, et 3 à 7 jours ouvrés en province. La livraison est offerte dès $199 d'achat." },
  { match: /(paiement|payer|orange|airtel|m-?pesa|cash|argent)/i, reply: "Nous acceptons Orange Money, Airtel Money, M-Pesa et le cash à la livraison. Le paiement se fait directement avec votre revendeur dans la discussion de commande — jamais avant confirmation de disponibilité." },
  { match: /(revendeur|devenir|inviter|code)/i, reply: "Les revendeurs Celebobo traitent les commandes assignées et gagnent une commission. Créez un compte puis demandez votre code revendeur : vos filleuls s'inscrivent avec ce code." },
  { match: /(garantie|retour|rembours|échange|echange)/i, reply: "Tous nos produits sont garantis 12 mois. Retour possible sous 30 jours si le produit est dans son emballage d'origine. Contactez-nous depuis votre discussion de commande." },
  { match: /(merci|thanks|super|parfait)/i, reply: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions." },
];

export const FALLBACK_REPLY =
  "Je n'ai pas bien compris, mais je peux vous aider sur : le choix d'un produit (smartphone, ordinateur, audio, gaming), la commande, la livraison ou le paiement. Pour un cas précis, ouvrez une discussion avec un revendeur depuis vos messages.";
