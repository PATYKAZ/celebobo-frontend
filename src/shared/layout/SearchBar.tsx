"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, Category2, Clock, CloseCircle, SearchNormal1, Trash } from "iconsax-reactjs";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useProductSuggestions } from "@/modules/products/hooks/useProducts";
import { useRecentSearches } from "@/modules/search/hooks/useRecentSearches";

/** Surligne les occurrences de `q` dans `text` (insensible à la casse / aux accents simples). */
function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  const term = q.trim();
  if (!term) return text;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-inherit">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

type Option =
  | { id: string; kind: "recent"; label: string }
  | { id: string; kind: "category"; label: string; href: string; count: number }
  | { id: string; kind: "product"; label: string; href: string; image: string | null; category: string; price: number }
  | { id: string; kind: "all"; label: string };

/**
 * Recherche du header : sélecteur de catégorie + champ + loupe.
 * Autocomplétion : navigation clavier (↑ ↓ Entrée Échap, pattern ARIA combobox/listbox), surlignage,
 * catégories correspondantes, produits suggérés et recherches récentes (effaçables).
 */
export function SearchBar({ className, compact }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const uid = useId();
  const { data: categories } = useCategories();
  const recent = useRecentSearches();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(q, 250);
  const { data: suggestions, isFetching } = useProductSuggestions(debounced);
  const box = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const term = q.trim();
  const typing = term.length >= 2;

  const options = useMemo<Option[]>(() => {
    if (!typing) return recent.items.map((label) => ({ id: `r-${label}`, kind: "recent" as const, label }));
    const cats: Option[] = (categories ?? [])
      .filter((c) => c.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 3)
      .map((c) => ({ id: `c-${c.id}`, kind: "category" as const, label: c.name, href: ROUTES.category(c.id), count: c.productsCount }));
    const prods: Option[] = (suggestions ?? []).map((s) => ({ id: `p-${s.id}`, kind: "product" as const, label: s.name, href: ROUTES.product(s.id), image: s.image, category: s.category, price: s.priceSolde ?? s.price }));
    return [...cats, ...prods, { id: "all", kind: "all" as const, label: term }];
  }, [typing, recent.items, categories, suggestions, term]);

  useEffect(() => setActive(-1), [options.length, term]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goSearch = (value: string) => {
    setOpen(false);
    recent.add(value);
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (category) params.set("category", category);
    router.push(`${ROUTES.search()}${params.size ? `?${params}` : ""}`);
  };

  const choose = (o: Option) => {
    if (o.kind === "recent") {
      setQ(o.label);
      goSearch(o.label);
    } else if (o.kind === "all") goSearch(q);
    else {
      setOpen(false);
      router.push(o.href);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const o = options[active];
    if (o) choose(o);
    else goSearch(q);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!options.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    }
  };

  const showPanel = open && (typing || recent.items.length > 0);
  const listId = `${uid}-list`;

  return (
    <form ref={box} onSubmit={submit} role="search" className={cn("relative scroll-mt-20", className)}>
      <div className="flex h-[48px] overflow-hidden rounded-pill bg-white sm:h-[45px]">
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
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${uid}-${options[active]?.id}` : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 bg-white px-4 text-[16px] text-ink outline-none placeholder:text-ink-3 sm:border-l sm:border-line-3 sm:px-3 sm:text-[13px]"
        />
        {q && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="grid w-8 shrink-0 place-items-center bg-white text-ink-3 hover:text-ink"
          >
            <CloseCircle size={16} variant="Bold" />
          </button>
        )}
        <button type="submit" aria-label="Lancer la recherche" className="grid w-14 shrink-0 place-items-center bg-white text-ink transition-colors hover:text-primary active:text-primary sm:w-12">
          <SearchNormal1 size={16} variant="Bold" />
        </button>
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={typing ? "Suggestions" : "Recherches récentes"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-box border border-line-3 bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.14)]"
          >
            {!typing && (
              <li role="presentation" className="flex items-center justify-between px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                Recherches récentes
                <button type="button" onClick={recent.clear} className="flex items-center gap-1 normal-case tracking-normal text-ink-3 hover:text-danger">
                  <Trash size={12} /> Tout effacer
                </button>
              </li>
            )}
            {typing && !suggestions && isFetching && <li role="presentation" className="px-3 py-4 text-[13px] text-ink-3">Recherche…</li>}
            {typing && suggestions && suggestions.length === 0 && !options.some((o) => o.kind === "category") && <li role="presentation" className="px-3 py-3 text-[13px] text-ink-3">Aucun produit pour « {term} »</li>}

            {options.map((o, i) => {
              const isActive = i === active;
              const base = cn("flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors", isActive ? "bg-primary-50" : "hover:bg-chip");
              const previous = options[i - 1];
              const heading =
                typing && o.kind !== previous?.kind && (o.kind === "category" || o.kind === "product")
                  ? o.kind === "category"
                    ? "Catégories"
                    : "Produits"
                  : null;
              return (
                <Fragment key={o.id}>
                  {heading && <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">{heading}</li>}
                  <li id={`${uid}-${o.id}`} role="option" aria-selected={isActive} onMouseEnter={() => setActive(i)}>
                    {o.kind === "recent" && (
                      <div className={cn(base, "justify-between")}>
                        <button type="button" onClick={() => choose(o)} className="flex min-w-0 flex-1 items-center gap-3 text-[13px] font-semibold">
                          <Clock size={16} className="shrink-0 text-ink-3" /> <span className="truncate">{o.label}</span>
                        </button>
                        <button type="button" aria-label={`Retirer « ${o.label} »`} onClick={() => recent.remove(o.label)} className="text-ink-3 hover:text-danger">
                          <CloseCircle size={16} />
                        </button>
                      </div>
                    )}
                    {o.kind === "category" && (
                      <button type="button" onClick={() => choose(o)} className={base}>
                        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-chip"><Category2 size={18} variant="Bold" /></span>
                        <span className="min-w-0 flex-1 text-[13px] font-bold"><Highlight text={o.label} q={term} /></span>
                        <span className="text-[12px] text-ink-3">{o.count} produits</span>
                      </button>
                    )}
                    {o.kind === "product" && (
                      <button type="button" onClick={() => choose(o)} className={base}>
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">{o.image && <Image src={o.image} alt="" fill sizes="44px" className="object-cover" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold leading-[18px]"><Highlight text={o.label} q={term} /></span>
                          <span className="text-[12px] text-ink-3">{o.category}</span>
                        </span>
                        <span className="text-[13px] font-semibold text-primary">{formatPrice(o.price)}</span>
                      </button>
                    )}
                    {o.kind === "all" && (
                      <button type="button" onClick={() => choose(o)} className={cn(base, "mt-1 justify-center text-[13px] font-semibold text-primary")}>
                        <SearchNormal1 size={14} /> Voir tous les résultats pour « {o.label} »
                      </button>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}
