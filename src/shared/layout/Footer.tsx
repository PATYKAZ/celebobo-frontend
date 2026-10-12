"use client";

import Link from "next/link";
import { Call, Facebook, Instagram, Location, Music, Sms, Tenx, Whatsapp, Youtube } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { CircleButton } from "@/shared/ui/CircleButton";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { paymentMethod, supportLabel, useSiteSettings, type SocialNetwork } from "@/modules/site";
import { FooterColumn } from "./FooterColumn";
import { NewsletterForm } from "./NewsletterForm";
import { CurrencySwitch } from "@/shared/currency/CurrencySwitch";

const COLUMNS = [
  {
    title: "Top catégories",
    links: [], // catégories réelles de l'API (cf. Footer)
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
  const { data: categories } = useCategories();
  const categoryLinks: [string, string][] = (categories ?? []).filter((c) => c.productsCount > 0).map((c) => [c.name, ROUTES.category(c.slug)]);
  return (
    <footer className="mt-6 bg-white lg:mt-[40px]">
      <div className="container pt-8 lg:pt-[79px]">
        <div className="grid gap-8 lg:grid-cols-[293px_repeat(4,1fr)] lg:gap-8">
          {/* Colonne 1 */}
          <div>
            <h2 className="text-section uppercase">Celebobo — la tech en confiance</h2>
            <p className="mt-[34px] text-[14px] uppercase leading-[23.8px]">{supportLabel(site)}</p>
            <a href={site.hotlineHref} className="mt-1 flex min-h-11 items-center text-[30px] font-bold leading-[36px] text-primary">{site.hotline}</a>
            {!site.supportAlwaysOpen && site.openingHours.length > 0 && (
              <ul className="mt-1 text-[13px] leading-[20px] text-ink-2">
                {site.openingHours.map((h) => (
                  <li key={h.days}>{h.days} : {h.hours}</li>
                ))}
              </ul>
            )}
            <p className="mt-6 flex items-start gap-2 text-[14px] leading-[23.8px]">
              <Location size={18} className="mt-1 shrink-0" />
              <span>{site.address.map((line, i) => <span key={i}>{i > 0 && <>,<br /></>}{line}</span>)}</span>
            </p>
            <a href={`mailto:${site.email}`} className="mt-1 flex min-h-11 items-center gap-2 text-[14px] hover:text-primary"><Sms size={18} /> {site.email}</a>
            <div className="mt-8 flex gap-[14px]">
              {SOCIALS.filter((n) => site.social[n.key]).map(({ key, label, icon: Icon }) => (
                <CircleButton key={key} size={44} tone="social" label={label} href={site.social[key]}><Icon size={17} variant="Bold" /></CircleButton>
              ))}
              <CircleButton size={44} tone="social" label="WhatsApp" href={site.whatsappUrl}><Whatsapp size={17} variant="Bold" /></CircleButton>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.title === "Top catégories" ? categoryLinks : col.links} />
          ))}
        </div>

        {/* Ligne 2 */}
        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-2">Afficher les prix en</p>
            <CurrencySwitch size="md" />
            <p className="mt-2 max-w-[260px] text-[12px] leading-[17px] text-ink-3">Paiement toujours calculé en dollars, au taux du jour.</p>
          </div>
          <div className="w-full max-w-[857px] lg:ml-auto">
            <h2 className="text-section uppercase">Abonnez-vous et obtenez <span className="text-danger">{site.newsletterDiscount} % de remise</span> sur votre première commande</h2>
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
          <a href={site.whatsappUrl} className="flex min-h-11 items-center gap-2 text-[14px] text-info hover:underline"><Call size={16} variant="Bold" /> Assistance WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
