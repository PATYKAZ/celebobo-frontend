"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "celebobo-recent-searches";
const MAX = 6;

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
};
const write = (list: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible : on ignore */
  }
};

/** Recherches récentes (localStorage) : ajout dédoublonné, suppression unitaire, effacement complet. */
export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => setItems(read()), []);

  const add = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
    write(next);
    setItems(next);
  }, []);

  const remove = useCallback((term: string) => {
    const next = read().filter((x) => x !== term);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, add, remove, clear };
}
