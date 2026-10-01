"use client";

import Link from "next/link";
import { ArrowRight2, Heart, Messages2, Profile, Receipt2 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { Drawer } from "@/shared/ui/Overlay";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { useCategories } from "@/modules/categories/hooks/useCategories";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories } = useCategories();
  const { isAuthenticated, isAdmin } = useAuth();
  const row = "flex items-center justify-between rounded-md px-3 py-3 text-[14px] font-semibold transition-colors hover:bg-chip";

  return (
    <Drawer open={open} onClose={onClose} title="Menu">
      <div className="space-y-5 p-4" onClick={onClose}>
        <div className="grid grid-cols-2 gap-2">
          {!isAuthenticated ? (
            <>
              <Link href={ROUTES.login()} className="rounded-box bg-primary py-3 text-center text-[13px] font-bold uppercase text-white">Connexion</Link>
              <Link href={ROUTES.register} className="rounded-box bg-chip py-3 text-center text-[13px] font-bold uppercase">Inscription</Link>
            </>
          ) : (
            <>
              <Link href={ROUTES.profile} className="flex items-center justify-center gap-2 rounded-box bg-chip py-3 text-[13px] font-bold"><Profile size={16} /> Profil</Link>
              <Link href={ROUTES.orders} className="flex items-center justify-center gap-2 rounded-box bg-chip py-3 text-[13px] font-bold"><Receipt2 size={16} /> Commandes</Link>
              <Link href={ROUTES.favorites} className="flex items-center justify-center gap-2 rounded-box bg-chip py-3 text-[13px] font-bold"><Heart size={16} /> Favoris</Link>
              <Link href={ROUTES.messages} className="flex items-center justify-center gap-2 rounded-box bg-chip py-3 text-[13px] font-bold"><Messages2 size={16} /> Messages</Link>
            </>
          )}
        </div>

        <nav className="flex flex-col">
          <Link href={ROUTES.home} className={row}>Accueil <ArrowRight2 size={14} /></Link>
          <Link href={ROUTES.products} className={row}>Tous les produits <ArrowRight2 size={14} /></Link>
          <Link href={ROUTES.about} className={row}>À propos <ArrowRight2 size={14} /></Link>
          <Link href={ROUTES.guide} className={row}>Guide d&apos;achat <ArrowRight2 size={14} /></Link>
          <Link href={ROUTES.assistant} className={row}>Assistant Celebobo <ArrowRight2 size={14} /></Link>
          <Link href={ROUTES.contact} className={row}>Contact <ArrowRight2 size={14} /></Link>
          {isAdmin && <Link href={ROUTES.admin.root} className={`${row} text-primary`}>Back-office <ArrowRight2 size={14} /></Link>}
        </nav>

        <div>
          <p className="mb-2 px-3 text-[12px] font-bold uppercase tracking-wider text-ink-3">Catégories</p>
          <div className="flex flex-col">
            {categories?.map((c) => (
              <Link key={c.id} href={ROUTES.category(c.id)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-chip">
                <CategoryIcon name={c.icon} size={18} /> {c.name}
              </Link>
            ))}
          </div>
        </div>

        <a href={SITE.hotlineHref} className="block rounded-box bg-primary-50 p-4 text-center">
          <span className="text-[12px] uppercase text-ink-2">Hotline 24/7</span>
          <span className="block text-[20px] font-bold text-primary">{SITE.hotline}</span>
        </a>
      </div>
    </Drawer>
  );
}
