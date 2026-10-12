"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Crown1, Truck } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Float, ParallaxImage } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useShippingZones } from "@/modules/checkout/hooks/useCheckout";
import { useSiteSettings } from "@/modules/site";
import { useMyMembership } from "@/modules/membership/hooks/useMembership";

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names.at(-1)}` : names[0]);

const BAND = "relative flex min-h-[107px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-6 text-center text-[14px] leading-[24px] text-white sm:gap-x-3 sm:py-5 sm:text-[18px] sm:leading-[32.4px]";

/**
 * Bandeau sous l'offre du jour : Celebobo Plus quand le programme est activé dans l'admin (prix et essai réels),
 * sinon le bandeau livraison.
 */
export function MemberBanner() {
  const { programmes } = useSiteSettings();
  return programmes.membership.enabled ? <PlusBanner /> : <ShippingBanner />;
}

function Band({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[15px] bg-ink-dark">
        <ParallaxImage src="/images/hero/hero-3.jpg" alt="" fill sizes="1300px" strength={30} wrapperClassName="absolute! inset-0" />
        <div className="absolute inset-0 bg-linear-to-r from-primary-dark/95 via-primary/80 to-black/70" />
        <div className={BAND}>{children}</div>
      </div>
    </Reveal>
  );
}

/** Celebobo Plus : livraison offerte sans minimum dans les zones membres, au prix et à l'essai réglés dans l'admin. */
function PlusBanner() {
  const { membership } = useSiteSettings().programmes;
  const { isAuthenticated, user } = useAuth();
  const formatPrice = useFormatPrice();
  const client = user?.role === "client";
  const { data: mine } = useMyMembership(client);
  const member = mine?.status === "trial" || mine?.status === "active";
  // zones réellement marquées pour les membres (Bukavu, Goma…)
  const { data: zones } = useShippingZones();
  const memberZones = (zones ?? []).filter((z) => z.memberFreeShipping).map((z) => z.name);
  return (
    <Band>
      <Float>
        <Crown1 size={30} variant="Bold" className="text-sun" />
      </Float>
      <span>Celebobo Plus :</span>
      <span className="font-semibold uppercase text-sun">livraison offerte*</span>
      <span>sans minimum, dès {formatPrice(membership.monthlyPrice)} par mois.</span>
      <span className="basis-full text-[12px] leading-[18px] text-white/75 sm:text-[13px]">
        *{memberZones.length ? `À ${list(memberZones)}` : "Dans les zones membres"}. Ou {formatPrice(membership.yearlyPrice)} par an.
      </span>
      {!isAuthenticated ? (
        membership.trialDays > 0 && (
          <Link href={ROUTES.register} className="link-underline basis-full py-1 text-[14px] font-semibold leading-[25px]">
            Créez votre compte : {membership.trialDays} jours d’essai gratuit
          </Link>
        )
      ) : (
        client && (
          <Link href={ROUTES.membership} className="link-underline basis-full py-1 text-[14px] font-semibold leading-[25px]">
            {member ? "Vous êtes membre Plus : voir mon abonnement" : mine?.trialAvailable && membership.trialDays > 0 ? `Essayer ${membership.trialDays} jours gratuitement` : "Je m’abonne"}
          </Link>
        )
      )}
    </Band>
  );
}

/**
 * Bandeau livraison (1300×107, rad 15, photo en parallaxe) : seuil de livraison offerte et zones concernées lus
 * dans les zones de livraison. Masqué si aucune zone n'offre la livraison (pas de promesse sans règle derrière).
 */
function ShippingBanner() {
  const { data: zones } = useShippingZones();
  const formatPrice = useFormatPrice();
  const free = (zones ?? []).filter((z) => z.freeThreshold !== null);
  if (!free.length) return null;
  const threshold = Math.min(...free.map((z) => z.freeThreshold as number));
  const names = free.filter((z) => z.freeThreshold === threshold).map((z) => z.name);
  return (
    <Band>
      <Float>
        <Truck size={30} variant="Bold" className="text-sun" />
      </Float>
      <span className="font-semibold uppercase text-sun">Livraison offerte</span>
      <span>dès {formatPrice(threshold)} d’achat {names.length === free.length && free.length === zones?.length ? "partout où nous livrons" : `à ${list(names)}`}.</span>
      <Link href={ROUTES.guide} className="link-underline ml-0 basis-full py-1 text-[14px] font-semibold leading-[25px] sm:ml-6 sm:basis-auto sm:font-normal">
        Zones et délais de livraison
      </Link>
    </Band>
  );
}
