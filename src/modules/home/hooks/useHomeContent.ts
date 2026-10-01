"use client";

import { useQuery } from "@tanstack/react-query";
import { homeService } from "../services/home.service";

export function useHomeContent() {
  return useQuery({ queryKey: ["home", "content"], queryFn: homeService.content, staleTime: 5 * 60_000 });
}
