"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Combobox } from "@/shared/ui/Combobox";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useAdminProducts } from "../../products/hooks/useAdminProducts";

interface Props {
  value: Product | null;
  onChange: (p: Product) => void;
  error?: string;
  label?: string;
  compact?: boolean;
}

/** Sélecteur de produit avec recherche (serveur) et vignettes. */
export function ProductCombobox({ value, onChange, error, label, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 250);
  // liste du back-office : stock réel et prix d'achat (marge) des produits ; chargée à l'ouverture
  const { data, isFetching } = useAdminProducts({ search: dq, pageSize: 8 }, open);

  return (
    <Combobox
      label={label}
      ariaLabel="Choisir un produit"
      required={!!label}
      error={error}
      items={data?.results ?? []}
      loading={isFetching}
      getKey={(p) => String(p.id)}
      selectedKey={value ? String(value.id) : null}
      onSelect={onChange}
      onOpenChange={setOpen}
      renderItem={(p) => (
        <>
          <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page sm:size-10">{p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">{p.name}</span>
            <span className="text-[12px] text-ink-3">
              {p.category} · <span className={p.stock <= 0 ? "text-danger" : p.stock <= p.stockThreshold ? "text-[#b87400]" : ""}>stock {p.stock}</span>
            </span>
          </span>
          <span className="text-[13px] font-semibold text-primary">{formatPrice(getPricing(p).current)}</span>
        </>
      )}
      trigger={
        value ? (
          <>
            <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-page">{value.image && <Image src={value.image} alt="" fill sizes="32px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{value.name}</span>
          </>
        ) : (
          <span className="flex-1 text-ink-3">Choisir un produit…</span>
        )
      }
      triggerClassName={cn("gap-3", compact && "h-[45px]")}
      search={q}
      onSearchChange={setQ}
      searchLabel="Rechercher un produit"
      emptyText="Aucun produit trouvé."
      sheetTitle="Choisir un produit"
    />
  );
}
