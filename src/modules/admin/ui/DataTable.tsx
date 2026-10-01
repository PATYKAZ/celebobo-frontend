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
  /** Masquer sous un breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl";
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

/** Tableau de données générique du back-office (lignes animées, squelettes, pagination). */
export function DataTable<T>({ columns, rows, rowKey, loading, empty, onRowClick, page, pageCount, onPageChange, className, skeletonRows = 6 }: Props<T>) {
  const th = (c: Column<T>) => cn("whitespace-nowrap px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3", ALIGN[c.align ?? "left"], c.hideBelow && HIDE[c.hideBelow]);
  const td = (c: Column<T>) => cn("px-4 py-3.5 align-middle text-[14px]", ALIGN[c.align ?? "left"], c.hideBelow && HIDE[c.hideBelow], c.className);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
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
      {!loading && rows?.length === 0 && (empty ?? <p className="py-14 text-center text-[14px] text-ink-3">Aucun résultat.</p>)}
      {page != null && pageCount != null && onPageChange && <Pagination page={page} pageCount={pageCount} onChange={onPageChange} className="py-5" />}
    </div>
  );
}
