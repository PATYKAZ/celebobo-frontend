"use client";

import Image from "next/image";
import { Apple, GooglePlay, WalletMoney } from "@/shared/ui/icons";
import { Float } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { cn } from "@/shared/lib/cn";
import { useSiteSettings, type Programmes } from "@/modules/site";

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Cagnotte : taux, seuil d'utilisation, part maximale d'une commande et durée de validité, tels que réglés dans l'admin. */
function CashbackBanner({ cashback }: { cashback: Programmes["cashback"] }) {
  const formatPrice = useFormatPrice();
  return (
    <Reveal className="h-full">
      <div className="group relative flex h-full min-h-[180px] items-center overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/products/charger.jpg" alt="" fill sizes="(min-width:1024px) 646px, 100vw" className="object-cover opacity-70 transition-transform duration-900 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-r from-primary-dark/90 via-primary/75 to-black/60" />
        <div className="relative ml-auto w-full max-w-[340px] px-6 py-8 sm:mr-12 sm:px-0">
          <Float slow>
            <p className="flex items-center gap-2 text-[34px] font-bold leading-[42px] text-sun sm:text-[40px] sm:leading-[48px]">
              <WalletMoney size={34} variant="Bold" aria-hidden /> {pct(cashback.percent)}
            </p>
          </Float>
          <p className="mt-1 text-[15px] font-semibold text-white">remboursés dans votre cagnotte</p>
          <p className="mt-2 text-[13px] leading-[19px] text-white/85">
            Sur chaque commande livrée. À utiliser dès {formatPrice(cashback.minBalance)} sur vos prochains achats, jusqu’à {cashback.maxShare} % d’une commande. Valable {cashback.validityMonths} mois.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

const STORE = "inline-flex h-12 items-center gap-2.5 rounded-[10px] bg-black px-4 text-white ring-1 ring-white/25 transition-transform hover:scale-[1.03] active:scale-95";

/** Liens vers les stores : seuls ceux renseignés dans l'admin s'affichent (aucun envoi par SMS). */
function AppBanner({ links }: { links: Programmes["appLinks"] }) {
  return (
    <Reveal className="h-full">
      <div className="group relative h-full min-h-[180px] overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/products/phone-dark.jpg" alt="" fill sizes="(min-width:1024px) 646px, 100vw" className="object-cover opacity-50 transition-transform duration-900 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/30" />
        <div className="relative flex h-full flex-col justify-center gap-4 px-6 py-8 sm:px-10">
          <div>
            <h3 className="text-[24px] font-medium leading-[28.8px] text-white">Téléchargez notre app</h3>
            <p className="mt-1 text-[13px] leading-[19px] text-white/80">Suivez vos commandes et discutez avec votre revendeur depuis votre téléphone.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {links.appStore && (
              <a href={links.appStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <Apple size={24} variant="Bold" aria-hidden />
                <span className="text-left leading-[14px]"><span className="block text-[10px]">Télécharger dans</span><span className="text-[16px] font-semibold">l’App Store</span></span>
              </a>
            )}
            {links.playStore && (
              <a href={links.playStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <GooglePlay size={24} variant="Bold" aria-hidden />
                <span className="text-left leading-[14px]"><span className="block text-[10px]">Disponible sur</span><span className="text-[16px] font-semibold">Google Play</span></span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** Cagnotte et application : chaque bloc n'apparaît que si le programme est activé (ou un lien de store renseigné). */
export function ProgrammesRow() {
  const { programmes } = useSiteSettings();
  const cashback = programmes.cashback.enabled;
  const app = !!(programmes.appLinks.appStore || programmes.appLinks.playStore);
  if (!cashback && !app) return null;
  return (
    <section className={cn("grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4", cashback && app && "lg:grid-cols-2")}>
      {cashback && <CashbackBanner cashback={programmes.cashback} />}
      {app && <AppBanner links={programmes.appLinks} />}
    </section>
  );
}
