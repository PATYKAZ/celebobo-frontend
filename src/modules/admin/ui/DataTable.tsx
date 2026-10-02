"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Classes de la cellule (largeur, alignement…) */
  className?: string;
  align?: "left" | "right" | "center";
  /** Masquer sous un breakpoint (tableau desktop) */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /**
   * Rendu « carte » sur mobile (< md) :
   *  - "title"  : en-tête de la carte (défaut : 1ʳᵉ colonne)
   *  - "footer" : zone d'actions en bas (défaut : colonne `actions` / sans en-tête)
   *  - "hide"   : non affichée
   *  - sinon    : paire « libellé / valeur »
   */
  mobile?: "title" | "footer" | "hide";
  /** Libellé affiché sur mobile si différent de l'en-tête (ex: en-tête = icône) */
  mobileLabel?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (p: number) => void;
  className?: string;
  /** Nombre de lignes squelette */
  skeletonRows?: number;
}

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" } as const;
const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

const isAction = (c: { key: string; header: ReactNode }) => c.key === "actions" || c.key === "action" || c.header === "" || c.header == null;
const isSelect = (c: { key: string }) => c.key === "select" || c.key === "checkbox";

/**
 * Tableau de données générique du back-office.
 * ≥ md : tableau classique (lignes animées, squelettes). < md : liste de cartes empilées, plus lisible au doigt.
 */
export function DataTable<T>({ columns, rows, rowKey, loading, empty, onRowClick, page, pageCount, onPageChange, className, skeletonRows = 6 }: Props<T>) {
  const th = (c: Column<T>) => cn("whitespace-nowrap px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3", ALIGN[c.align ?? "left"], c.hideBelow && HIDE[c.hideBelow]);
  const td = (c: Column<T>) => cn("px-4 py-3.5 align-middle text-[14px]", ALIGN[c.align ?? "left"], c.hideBelow && HIDE[c.hideBelow], c.className);

  // classement des colonnes pour le rendu carte
  const selectCol = columns.find(isSelect);
  const usable = columns.filter((c) => !isSelect(c) && c.mobile !== "hide");
  const titleCol = usable.find((c) => c.mobile === "title") ?? usable.find((c) => c.mobile !== "footer" && !isAction(c)) ?? usable[0];
  const footerCols = usable.filter((c) => c !== titleCol && (c.mobile === "footer" || (c.mobile === undefined && isAction(c))));
  const metaCols = usable.filter((c) => c !== titleCol && !footerCols.includes(c));

  return (
    <div className={className}>
      {/* ───── Desktop / tablette : tableau ───── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-line-3 bg-page/50">
              {columns.map((c) => (
                <th key={c.key} className={th(c)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} className="border-b border-line-3/70">
                    {columns.map((c) => (
                      <td key={c.key} className={td(c)}><Skeleton className="h-4 w-full max-w-[160px]" /></td>
                    ))}
                  </tr>
                ))
              : rows?.map((row, i) => (
                  <motion.tr
                    key={rowKey(row)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.35 }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn("border-b border-line-3/70 transition-colors hover:bg-primary-50", onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={td(c)}>{c.cell(row, i)}</td>
                    ))}
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* ───── Mobile : cartes ───── */}
      <div className="flex flex-col gap-2.5 p-3 md:hidden">
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 4) }, (_, i) => (
              <div key={i} className="space-y-3 rounded-box border border-line-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : rows?.map((row, i) => (
              <motion.article
                key={rowKey(row)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("rounded-box border border-line-3 bg-white p-4 transition-colors", onRowClick && "cursor-pointer active:bg-primary-50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-[14px]">{titleCol?.cell(row, i)}</div>
                  {selectCol && <div onClick={(e) => e.stopPropagation()}>{selectCol.cell(row, i)}</div>}
                </div>
                {metaCols.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line-3/70 pt-3">
                    {metaCols.map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{c.mobileLabel ?? c.header}</dt>
                        <dd className="mt-0.5 min-w-0 break-words text-[13px] font-medium">{c.cell(row, i)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {footerCols.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line-3/70 pt-3" onClick={(e) => e.stopPropagation()}>
                    {footerCols.map((c) => (
                      <div key={c.key}>{c.cell(row, i)}</div>
                    ))}
                  </div>
                )}
              </motion.article>
            ))}
      </div>

      {!loading && rows?.length === 0 && (empty ?? <p className="py-14 text-center text-[14px] text-ink-3">Aucun résultat.</p>)}
      {page != null && pageCount != null && onPageChange && <Pagination page={page} pageCount={pageCount} onChange={onPageChange} className="py-5" />}
    </div>
  );
}
