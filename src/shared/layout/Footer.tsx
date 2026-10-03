"use client";

import Link from "next/link";
import { ArrowDown2, Call, Facebook, Instagram, Location, Music, Sms, Tenx, Whatsapp, Youtube } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { CircleButton } from "@/shared/ui/CircleButton";
import { paymentMethod, useSiteSettings, type SocialNetwork } from "@/modules/site";
import { FooterColumn } from "./FooterColumn";
import { NewsletterForm } from "./NewsletterForm";

const COLUMNS = [
  {
    title: "Top catégories",
    links: [
      ["Smartphones", ROUTES.category("smartphones")],
      ["Ordinateurs", ROUTES.category("ordinateurs-portables")],
      ["Tablettes", ROUTES.category("tablettes")],
      ["Audio", ROUTES.category("audio")],
      ["Montres connectées", ROUTES.category("montres-connectees")],
      ["Gaming", ROUTES.category("gaming")],
      ["Accessoires", ROUTES.category("accessoires")],
      ["Photo & vidéo", ROUTES.search("photo")],
    ],
  },
  {
    title: "Entreprise",
    links: [
      ["À propos de Celebobo", ROUTES.about],
      ["Contact", ROUTES.contact],
      ["Guide d'achat", ROUTES.guide],
      ["Assistant Celebobo", ROUTES.assistant],
      ["Tous les produits", ROUTES.products],
    ],
  },
  {
    title: "Centre d'aide",
    links: [
      ["Mon compte", ROUTES.profile],
      ["Suivre ma commande", ROUTES.orders],
      ["Mes messages", ROUTES.messages],
      ["Mes favoris", ROUTES.favorites],
      ["Questions fréquentes", ROUTES.guide],
      ["Conditions générales de vente", ROUTES.page("conditions")],
      ["Retours et remboursements", ROUTES.page("retours")],
    ],
  },
  {
    title: "Partenaires",
    links: [
      ["Devenir revendeur", ROUTES.register],
      ["Programme d'invitation", ROUTES.register],
      ["Nous contacter", ROUTES.contact],
    ],
  },
] as const;

const SOCIALS: { key: SocialNetwork; label: string; icon: typeof Facebook }[] = [
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Music },
  { key: "x", label: "X", icon: Tenx },
  { key: "youtube", label: "YouTube", icon: Youtube },
];

export function Footer() {
  const site = useSiteSettings();
  return (
    <footer className="mt-6 bg-white lg:mt-[40px]">
      <div className="container pt-8 lg:pt-[79px]">
        <div className="grid gap-8 lg:grid-cols-[293px_repeat(4,1fr)] lg:gap-8">
          {/* Colonne 1 */}
          <div>
            <h3 className="text-section uppercase">Celebobo — la tech en confiance</h3>
            <p className="mt-[34px] text-[14px] uppercase leading-[23.8px]">Hotline 24/7</p>
            <a href={site.hotlineHref} className="mt-1 block text-[30px] font-bold leading-[36px] text-primary">{site.hotline}</a>
            <p className="mt-6 flex items-start gap-2 text-[14px] leading-[23.8px]">
              <Location size={18} className="mt-1 shrink-0" />
              <span>{site.address.map((line, i) => <span key={i}>{i > 0 && <>,<br /></>}{line}</span>)}</span>
            </p>
            <a href={`mailto:${site.email}`} className="mt-3 flex items-center gap-2 text-[14px] hover:text-primary"><Sms size={18} /> {site.email}</a>
            <div className="mt-8 flex gap-[14px]">
              {SOCIALS.filter((n) => site.social[n.key]).map(({ key, label, icon: Icon }) => (
                <CircleButton key={key} size={35} tone="social" label={label} href={site.social[key]}><Icon size={15} variant="Bold" /></CircleButton>
              ))}
              <CircleButton size={35} tone="social" label="WhatsApp" href={site.whatsappUrl}><Whatsapp size={15} variant="Bold" /></CircleButton>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        {/* Ligne 2 */}
        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex gap-2">
            <span className="flex h-[43px] items-center gap-2 rounded-[8px] border border-line-2/20 px-4 text-[14px]">$ USD <ArrowDown2 size={11} /></span>
            <span className="flex h-[43px] items-center gap-2 rounded-[8px] border border-line-2/20 px-4 text-[14px]">Fr <ArrowDown2 size={11} /></span>
          </div>
          <div className="w-full max-w-[857px] lg:ml-auto">
            <h3 className="text-section uppercase">Abonnez-vous et obtenez <span className="text-danger">{site.newsletterDiscount} % de remise</span> sur votre première commande</h3>
            <div className="mt-6"><NewsletterForm /></div>
            <p className="mt-3 text-[13px] italic leading-[22px] text-ink-2">
              En vous abonnant, vous acceptez notre <Link href={ROUTES.contact} className="text-ink underline">politique de confidentialité</Link>
            </p>
          </div>
        </div>

        {/* Bas de page */}
        <div className="mt-[60px] flex flex-col items-start gap-5 border-t border-line-2/30 py-8 lg:mt-[80px] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-12">
            <p className="text-[14px] leading-[23.8px] text-ink-2">© {new Date().getFullYear()} <strong className="text-ink">{SITE.copyright}</strong>. Tous droits réservés.</p>
            <div className="flex flex-wrap gap-2">
              {site.paymentMethods.map((code) => (
                <span key={code} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${paymentMethod(code).cls}`}>{paymentMethod(code).label}</span>
              ))}
            </div>
          </div>
          <a href={site.whatsappUrl} className="flex items-center gap-2 text-[14px] text-info hover:underline"><Call size={16} variant="Bold" /> Assistance WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
