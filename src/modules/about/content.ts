import { Award, Box, Headphone, People, ShieldTick, TruckFast } from "iconsax-reactjs";

/** Textes de mise en page de « À propos » (l'histoire et les engagements viennent de la page `a-propos` du back-office). */
export const STATS = [
  { value: 12000, suffix: "+", label: "Clients satisfaits", icon: People },
  { value: 450, suffix: "+", label: "Produits en catalogue", icon: Box },
  { value: 60, suffix: "+", label: "Revendeurs partenaires", icon: Award },
  { value: 98, suffix: "%", label: "Commandes livrées à temps", icon: TruckFast },
];

export const VALUES = [
  { icon: ShieldTick, title: "Confiance", text: "Produits testés, garantie 12 mois et paiement uniquement après confirmation de disponibilité." },
  { icon: Headphone, title: "Proximité", text: "Chaque commande ouvre une discussion directe avec un revendeur qui vous accompagne jusqu'à la livraison." },
  { icon: TruckFast, title: "Rapidité", text: "Livraison sous 24 à 48 h à Kinshasa et suivi de votre commande en temps réel." },
  { icon: Award, title: "Qualité", text: "Nous sélectionnons les meilleures marques et vérifions chaque produit avant expédition." },
];

export const STORY = {
  badge: "Notre histoire",
  text: "Celebobo est née d'un constat : acheter du matériel high-tech de qualité en RD Congo doit être simple, transparent et sécurisé. Nous mettons en relation des clients et un réseau de revendeurs de confiance.",
};

export const MISSION = {
  title: "Notre mission",
  text: "Rendre la technologie accessible à tous : smartphones, ordinateurs, audio, gaming et accessoires, aux meilleurs prix, avec un service humain. Pas de paiement en ligne risqué : vous échangez avec un vrai revendeur, vous payez par Mobile Money ou en cash à la livraison.",
  points: ["Prix transparents, promotions régulières", "Revendeurs vérifiés et formés", "Garantie 12 mois sur tous les produits", "Support 7j/7 par discussion ou WhatsApp"],
};
