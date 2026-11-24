"use client";

import { ROUTES } from "@/config/routes";
import Link from "next/link";
import Image from "next/image";
import { Apple, GooglePlay, WalletMoney } from "@/shared/ui/icons";
import { Reveal } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { useSiteSettings, type Programmes } from "@/modules/site";

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Points de fidélité : taux et durée de validité, tels que réglés dans l'admin. */
function PointsBanner({ points }: { points: Programmes["points"] }) {
  return (
    <Reveal className="h-full">
      <div className="group relative flex h-full min-h-[180px] items-center overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/products/charger.jpg" alt="" fill sizes="(min-width:1024px) 646px, 100vw" className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-r from-primary-dark/90 via-primary/75 to-black/60" />
        {/* contenu en ligne sur toute la largeur : le taux, puis l'explication et le lien vers les conditions */}
        <div className="relative flex w-full flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:gap-10 sm:px-12">
            <p className="flex shrink-0 items-center gap-3 text-2xl font-bold text-sun">
              <WalletMoney size={34} variant="Bold" aria-hidden /> {pct(points.percent)}
            </p>
          <div className="max-w-2xl">
            <p className="text-base font-semibold text-white">de vos achats rendus en points de fidélité</p>
            <p className="mt-1 text-sm text-white/85">
              Sur chaque commande livrée, 1 point = 1 $. Utilisez-en autant que vous voulez sur vos prochains achats. Valables tant que vous achetez au moins une fois tous les {points.validityMonths} mois.
            </p>
            <Link href={ROUTES.page("programme-de-fidelite")} className="relative z-10 mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-sun underline-offset-4 hover:underline">
              Voir le programme
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

const STORE = "inline-flex h-12 items-center gap-2.5 rounded-box bg-black px-4 text-white ring-1 ring-white/25 transition-transform hover:scale-[1.03] active:scale-95";

/** Liens vers les stores : seuls ceux renseignés dans l'admin s'affichent (aucun envoi par SMS). */
function AppBanner({ links }: { links: Programmes["appLinks"] }) {
  return (
    <Reveal className="h-full">
      <div className="group relative h-full min-h-[180px] overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/products/phone-dark.jpg" alt="" fill sizes="(min-width:1024px) 646px, 100vw" className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/30" />
        <div className="relative flex h-full flex-col justify-center gap-4 px-6 py-8 sm:px-10">
          <div>
            <h3 className="text-xl font-medium text-white">Téléchargez notre app</h3>
            <p className="mt-1 text-sm text-white/80">Suivez vos commandes et discutez avec votre revendeur depuis votre téléphone.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {links.appStore && (
              <a href={links.appStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <Apple size={24} variant="Bold" aria-hidden />
                <span className="text-left"><span className="block text-xs">Télécharger dans</span><span className="text-base font-semibold">l’App Store</span></span>
              </a>
            )}
            {links.playStore && (
              <a href={links.playStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <GooglePlay size={24} variant="Bold" aria-hidden />
                <span className="text-left"><span className="block text-xs">Disponible sur</span><span className="text-base font-semibold">Google Play</span></span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** Points de fidélité et application : chaque bloc n'apparaît que si le programme est activé (ou un lien de store renseigné). */
export function ProgrammesRow() {
  const { programmes } = useSiteSettings();
  const points = programmes.points.enabled;
  const app = !!(programmes.appLinks.appStore || programmes.appLinks.playStore);
  if (!points && !app) return null;
  return (
    <section className={cn("grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4", points && app && "lg:grid-cols-2")}>
      {points && <PointsBanner points={programmes.points} />}
      {app && <AppBanner links={programmes.appLinks} />}
    </section>
  );
}
