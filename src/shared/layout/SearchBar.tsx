"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, SearchNormal1 } from "iconsax-reactjs";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useProductSuggestions } from "@/modules/products/hooks/useProducts";

/** Recherche du header : sélecteur de catégorie + champ + loupe, avec suggestions en direct. */
export function SearchBar({ className, compact }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 250);
  const { data: suggestions } = useProductSuggestions(debounced);
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    router.push(`${ROUTES.search()}${params.size ? `?${params}` : ""}`);
  };

  return (
    <form ref={box} onSubmit={submit} role="search" className={cn("relative", className)}>
      <div className="flex h-[45px] overflow-hidden rounded-pill bg-white">
        {!compact && (
          <div className="relative hidden w-[143px] shrink-0 sm:block">
            <select
              aria-label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-full w-full appearance-none rounded-l-[4px] bg-white pl-3 pr-8 text-[13px] font-bold leading-[19.5px] text-[#212529] outline-none"
            >
              <option value="">Catégories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ArrowDown2 size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#343A40]" />
          </div>
        )}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher"
          autoComplete="off"
          className="min-w-0 flex-1 bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-3 sm:border-l sm:border-line-3"
        />
        <button type="submit" aria-label="Lancer la recherche" className="grid w-12 shrink-0 place-items-center bg-white text-ink transition-colors hover:text-primary">
          <SearchNormal1 size={16} variant="Bold" />
        </button>
      </div>

      <AnimatePresence>
        {open && q.trim().length >= 2 && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 max-h-[380px] overflow-y-auto rounded-box border border-line-3 bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.14)]"
          >
            {!suggestions ? (
              <li className="px-3 py-4 text-[13px] text-ink-3">Recherche…</li>
            ) : suggestions.length === 0 ? (
              <li className="px-3 py-4 text-[13px] text-ink-3">Aucun résultat pour « {q} »</li>
            ) : (
              <>
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link href={ROUTES.product(s.id)} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-chip">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">
                        {s.image && <Image src={s.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold leading-[18px]">{s.name}</span>
                        <span className="text-[12px] text-ink-3">{s.category}</span>
                      </span>
                      <span className="text-[13px] font-semibold text-primary">{formatPrice(s.priceSolde ?? s.price)}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button type="submit" className="mt-1 w-full rounded-md py-2 text-center text-[13px] font-semibold text-primary hover:bg-primary-50">
                    Voir tous les résultats
                  </button>
                </li>
              </>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}
