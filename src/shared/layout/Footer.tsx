import Link from "next/link";
import { ArrowDown2, Call, Facebook, Instagram, Location, Sms, Tenx, Whatsapp, Youtube } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { CircleButton } from "@/shared/ui/CircleButton";
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

const PAYMENTS = [
  { label: "Orange Money", cls: "bg-[#FF7900] text-white" },
  { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  { label: "M-Pesa", cls: "bg-[#2AAE4A] text-white" },
  { label: "Cash", cls: "bg-ink-dark text-white" },
];

export function Footer() {
  return (
    <footer className="mt-6 bg-white lg:mt-[40px]">
      <div className="container pt-8 lg:pt-[79px]">
        <div className="grid gap-8 lg:grid-cols-[293px_repeat(4,1fr)] lg:gap-8">
          {/* Colonne 1 */}
          <div>
            <h3 className="text-section uppercase">Celebobo — la tech en confiance</h3>
            <p className="mt-[34px] text-[14px] uppercase leading-[23.8px]">Hotline 24/7</p>
            <a href={SITE.hotlineHref} className="mt-1 block text-[30px] font-bold leading-[36px] text-primary">{SITE.hotline}</a>
            <p className="mt-6 flex items-start gap-2 text-[14px] leading-[23.8px]">
              <Location size={18} className="mt-1 shrink-0" />
              <span>{SITE.address[0]},<br />{SITE.address[1]}</span>
            </p>
            <a href={`mailto:${SITE.email}`} className="mt-3 flex items-center gap-2 text-[14px] hover:text-primary"><Sms size={18} /> {SITE.email}</a>
            <div className="mt-8 flex gap-[14px]">
              <CircleButton size={35} tone="social" label="Facebook" href={SITE.social.facebook}><Facebook size={15} variant="Bold" /></CircleButton>
              <CircleButton size={35} tone="social" label="Instagram" href={SITE.social.instagram}><Instagram size={15} variant="Bold" /></CircleButton>
              <CircleButton size={35} tone="social" label="X" href={SITE.social.twitter}><Tenx size={15} variant="Bold" /></CircleButton>
              <CircleButton size={35} tone="social" label="YouTube" href={SITE.social.youtube}><Youtube size={15} variant="Bold" /></CircleButton>
              <CircleButton size={35} tone="social" label="WhatsApp" href={SITE.social.whatsapp}><Whatsapp size={15} variant="Bold" /></CircleButton>
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
            <h3 className="text-section uppercase">Abonnez-vous et obtenez <span className="text-danger">10 % de remise</span> sur votre première commande</h3>
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
              {PAYMENTS.map((p) => (
                <span key={p.label} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${p.cls}`}>{p.label}</span>
              ))}
            </div>
          </div>
          <a href={SITE.social.whatsapp} className="flex items-center gap-2 text-[14px] text-info hover:underline"><Call size={16} variant="Bold" /> Assistance WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
