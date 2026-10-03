/** Textes de mise en page du guide (le contenu éditorial vient du back-office : page `guide`, FAQ, réglages). */

/** Étapes affichées si la page `guide` n'a pas (encore) de liste numérotée. */
export const STEPS = [
  { title: "Choisissez vos produits", text: "Parcourez la boutique, comparez les prix et ajoutez vos articles au panier. Les promotions sont déjà appliquées." },
  { title: "Validez votre panier", text: "Vérifiez les quantités, indiquez votre adresse de livraison puis envoyez votre demande de commande." },
  { title: "Discutez avec un revendeur", text: "Une discussion s'ouvre automatiquement. Un revendeur confirme la disponibilité, le prix final et répond à vos questions." },
  { title: "Payez en toute sécurité", text: "Réglez par Orange Money, Airtel Money, M-Pesa ou en cash à la livraison — uniquement après confirmation." },
  { title: "Recevez votre commande", text: "Livraison sous 24 à 48 h à Kinshasa, 3 à 7 jours en province. Vous pouvez suivre l'avancement dans « Mes commandes »." },
];

/** Description de chaque moyen de paiement (codes de `settings.payment_methods`). */
export const PAYMENT_TEXT: Record<string, string> = {
  orange_money: "Paiement instantané depuis votre compte Orange.",
  airtel_money: "Transfert sécurisé vers le numéro du revendeur.",
  mpesa: "Paiement via Vodacom M-Pesa en quelques secondes.",
  cash: "Réglez à la livraison, après vérification du produit.",
  card: "Paiement par carte bancaire.",
};

export const DELIVERY = [
  { zone: "Kinshasa", delay: "24 – 48 h", fee: null },
  { zone: "Lubumbashi, Goma, Kisangani", delay: "3 – 5 jours", fee: "À partir de $7.50" },
  { zone: "Autres villes", delay: "5 – 7 jours", fee: "Selon destination" },
];
