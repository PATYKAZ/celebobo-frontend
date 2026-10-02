"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown2, Bag2, Call, Heart, HamburgerMenu, Logout, Messages2, Notification, Profile, Receipt2, Setting2, User,
} from "iconsax-reactjs";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { CircleButton } from "@/shared/ui/CircleButton";
import { Popover } from "@/shared/ui/Popover";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { displayName } from "@/modules/auth/types";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useFavoritesStore } from "@/modules/favorites/store/favorites.store";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";

const NAV = [
  { label: "Accueil", href: ROUTES.home },
  { label: "Produits", href: ROUTES.products, mega: true },
  {
    label: "Pages",
    href: "#",
    children: [
      { label: "À propos", href: ROUTES.about },
      { label: "Guide d'achat", href: ROUTES.guide },
      { label: "Assistant Celebobo", href: ROUTES.assistant },
    ],
  },
  { label: "Contact", href: ROUTES.contact },
] as const;

function NavItem({ item }: { item: (typeof NAV)[number] }) {
  const pathname = usePathname();
  const { data: categories } = useCategories();
  const active = item.href !== "#" && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
  const hasMenu = "mega" in item || "children" in item;

  const label = (
    <span className={cn("relative flex h-[41px] items-center gap-1 px-[15px] text-[14px] font-bold uppercase leading-[21px] transition-colors hover:text-primary", active && "text-primary")}>
      {item.label}
      {hasMenu && <ArrowDown2 size={11} className="opacity-80 transition-transform group-hover:rotate-180" />}
      <span className={cn("absolute inset-x-[15px] -bottom-px h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100", active && "scale-x-100")} />
    </span>
  );

  if (!hasMenu) {
    return (
      <Link href={item.href} className="group">
        {label}
      </Link>
    );
  }

  return (
    <Popover
      openOn="hover"
      className="group"
      triggerClassName="outline-none"
      trigger={label}
      panelClassName={"mega" in item ? "w-[560px] p-4" : "w-[220px]"}
    >
      {(close) =>
        "mega" in item ? (
          <div>
            <div className="grid grid-cols-2 gap-1">
              {categories?.map((c) => (
                <Link key={c.id} href={ROUTES.category(c.id)} onClick={close} className="group/i flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-chip">
                  <span className="grid size-9 place-items-center rounded-full bg-chip text-ink transition-colors group-hover/i:bg-primary group-hover/i:text-white">
                    <CategoryIcon name={c.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold leading-[18px]">{c.name}</span>
                    <span className="text-[11px] text-ink-3">{c.productsCount} produits</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link href={ROUTES.products} onClick={close} className="mt-2 block rounded-md bg-primary-50 py-2.5 text-center text-[13px] font-bold text-primary hover:bg-primary hover:text-white">
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <>
            {"children" in item &&
              item.children.map((c) => (
                <Link key={c.href} href={c.href} onClick={close} className="block rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-chip hover:text-primary">
                  {c.label}
                </Link>
              ))}
          </>
        )
      }
    </Popover>
  );
}

function CartButton() {
  const { count, total } = useCart();
  const pulse = useCartStore((s) => s.pulse);
  return (
    <Link href={ROUTES.cart} aria-label="Panier" className="group flex items-center gap-3">
      <span className="relative grid size-10 place-items-center rounded-full bg-chip transition-colors group-hover:bg-primary group-hover:text-white">
        <Bag2 size={20} variant="Bold" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`${count}-${pulse}`}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
            className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[11px] leading-none text-white ring-2 ring-white"
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="hidden flex-col xl:flex">
        <span className="text-[11px] uppercase leading-[16.5px] text-ink-2">Panier</span>
        <span className="text-[14px] font-bold leading-[21px]">{formatPrice(total)}</span>
      </span>
    </Link>
  );
}

function AccountMenu() {
  const { user, isAuthenticated, isStaff, isAdmin } = useAuth();
  const logout = useLogout();
  const item = "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-chip hover:text-primary";

  return (
    <div className="flex items-center gap-3">
      <Popover
        align="right"
        trigger={
          user?.avatar ? (
            <span className="relative block size-10 overflow-hidden rounded-full ring-2 ring-primary/30 transition hover:ring-primary">
              <Image src={user.avatar} alt={displayName(user)} fill sizes="40px" className="object-cover" />
            </span>
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
              <User size={20} variant="Bold" />
            </span>
          )
        }
        label="Mon compte"
        panelClassName="w-[240px]"
      >
        {(close) =>
          isAuthenticated && user ? (
            <div onClick={close}>
              <div className="mb-1 border-b border-line-3 px-3 pb-3 pt-1">
                <p className="truncate text-[14px] font-bold">{displayName(user)}</p>
                <p className="truncate text-[12px] text-ink-3">{user.email}</p>
              </div>
              <Link href={ROUTES.profile} className={item}><Profile size={17} /> Mon profil</Link>
              <Link href={ROUTES.orders} className={item}><Receipt2 size={17} /> Mes commandes</Link>
              <Link href={ROUTES.favorites} className={item}><Heart size={17} /> Mes favoris</Link>
              {isStaff && <Link href={ROUTES.admin.notifications} className={item}><Notification size={17} /> Notifications</Link>}
              {isStaff && <Link href={ROUTES.admin.root} className={cn(item, "text-primary")}><Setting2 size={17} /> {user.role === "revendeur" ? "Mon espace revendeur" : "Back-office"}</Link>}
              <button onClick={() => logout.mutate()} className={cn(item, "w-full text-danger hover:text-danger")}><Logout size={17} /> Déconnexion</button>
            </div>
          ) : (
            <div className="p-2" onClick={close}>
              <Link href={ROUTES.login()} className="block rounded-md bg-primary px-3 py-2.5 text-center text-[13px] font-bold uppercase text-white hover:bg-primary-dark">Connexion</Link>
              <Link href={ROUTES.register} className="mt-2 block rounded-md bg-chip px-3 py-2.5 text-center text-[13px] font-bold uppercase hover:bg-primary hover:text-white">Inscription</Link>
            </div>
          )
        }
      </Popover>
      <div className="hidden flex-col xl:flex">
        <span className="text-[11px] uppercase leading-[16.5px] text-ink-2">{isAuthenticated ? "Bienvenue" : "Bienvenue"}</span>
        {isAuthenticated && user ? (
          <Link href={ROUTES.profile} className="max-w-[130px] truncate text-[14px] font-bold uppercase leading-[21px] hover:text-primary">{user.firstName || user.username}</Link>
        ) : (
          <span className="whitespace-nowrap text-[14px] font-bold uppercase leading-[21px]">
            <Link href={ROUTES.login()} className="hover:text-primary">Connexion</Link> / <Link href={ROUTES.register} className="hover:text-primary">Inscription</Link>
          </span>
        )}
      </div>
    </div>
  );
}

/** En-tête principal : ligne info + navigation (bloc blanc rad 10, hauteur 144 desktop). */
export function Header() {
  const favCount = useFavoritesStore((s) => s.ids.length);
  const { isStaff } = useAuth();

  return (
    <header className="rounded-box bg-white max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:-mx-[15px] max-lg:rounded-none max-lg:border-b max-lg:border-line-3/70 max-lg:pt-[env(safe-area-inset-top)] max-lg:bg-white/95 max-lg:backdrop-blur-md">
      {/* Ligne 1 */}
      <div className="hidden items-center justify-between px-[30px] pt-[15px] lg:flex">
        <div className="flex items-center gap-5">
          <a href={SITE.hotlineHref} className="flex h-7 items-center gap-1.5 rounded-md bg-chip px-2.5 text-[12px] leading-[18px]">
            <Call size={12} variant="Bold" /> Hotline 24/7
          </a>
          <a href={SITE.hotlineHref} className="text-[12px] font-bold leading-[18px] hover:text-primary">{SITE.hotline}</a>
        </div>
        <div className="flex items-center text-[14px] leading-[21px]">
          <Link href={ROUTES.becomeReseller} className="px-5 transition-colors hover:text-primary">Devenir revendeur</Link>
          <Link href={ROUTES.track} className="px-5 transition-colors hover:text-primary">Suivre ma commande</Link>
          <span className="flex items-center gap-1 border-r border-line-2/60 px-5">$ USD <ArrowDown2 size={11} className="opacity-80" /></span>
          <span className="flex items-center gap-2 pl-5">
            <span className="grid size-[15px] place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#007FFF_33%,#F7D618_33%,#F7D618_66%,#CE1021_66%)]" aria-hidden />
            Fr <ArrowDown2 size={11} className="opacity-80" />
          </span>
        </div>
      </div>

      {/* Ligne 2 */}
      <div className="flex min-h-[60px] items-center gap-3 px-4 py-2 lg:min-h-0 lg:px-[30px] lg:pb-[23px] lg:pt-[15px]">
        <Logo className="mr-auto lg:mr-0" />

        <nav aria-label="Navigation principale" className="ml-8 hidden items-center lg:flex">
          {NAV.map((n) => (
            <NavItem key={n.label} item={n} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-[14px]">
          <span className="contents">
            <CircleButton href={ROUTES.messages} label="Messages" className="hidden lg:grid"><Messages2 size={19} variant="Bold" /></CircleButton>
            <span className="relative">
              <CircleButton href={ROUTES.favorites} label="Favoris" className="max-lg:!size-11"><Heart size={19} variant="Bold" /></CircleButton>
              {favCount > 0 && <span className="pointer-events-none absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] leading-[18px] text-white ring-2 ring-white">{favCount}</span>}
            </span>
            {isStaff && <CircleButton href={ROUTES.admin.notifications} label="Notifications" className="max-lg:!size-11"><Notification size={19} variant="Bold" /></CircleButton>}
          </span>
          <span className="hidden lg:contents"><AccountMenu /><CartButton /></span>
        </div>
      </div>
    </header>
  );
}
