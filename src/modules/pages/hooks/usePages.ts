"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/lib/api";
import { pagesService } from "../services/pages.service";

const STALE = 10 * 60_000;

export function usePages() {
  return useQuery({ queryKey: ["pages"], queryFn: pagesService.list, staleTime: STALE });
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ["pages", slug],
    queryFn: () => pagesService.get(slug),
    staleTime: STALE,
    retry: (n, e) => !(e instanceof ApiError && e.isNotFound) && n < 2,
  });
}

export function useFaq() {
  return useQuery({ queryKey: ["faq"], queryFn: pagesService.faq, staleTime: STALE });
}
