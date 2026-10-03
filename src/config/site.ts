/** Valeurs statiques du site — repli tant que `GET /settings/public/` n'a pas répondu (cf. modules/site). */
export const SITE = {
  name: "Celebobo",
  tagline: "Business Market",
  description: "Celebobo — votre boutique high-tech : smartphones, ordinateurs, audio, gaming et accessoires, avec livraison rapide et revendeurs de confiance.",
  hotline: "+243 970 000 000",
  hotlineHref: "tel:+243970000000",
  email: "contact@celebobo.com",
  address: ["Avenue du Commerce 24, Gombe", "Kinshasa, RD Congo"],
  copyright: "Celebobo Business",
  openingHours: [
    { days: "Lundi – Vendredi", hours: "08h00 – 19h00" },
    { days: "Samedi", hours: "09h00 – 17h00" },
    { days: "Dimanche", hours: "Support en ligne uniquement" },
  ],
  paymentMethods: ["orange_money", "airtel_money", "mpesa", "cash"],
  newsletterDiscount: 10,
  usdToCdf: 2850,
  shipping: { freeThreshold: 199, flatFee: 2.98 },
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://x.com",
    youtube: "https://youtube.com",
    whatsapp: "https://wa.me/243970000000",
  },
} as const;
