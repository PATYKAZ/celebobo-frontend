"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { resellersService } from "../services/resellers.service";
import type { ResellerListParams } from "../types";

export function useResellers(params: ResellerListParams) {
  return useQuery({
    queryKey: ["admin", "resellers", params],
    queryFn: () => resellersService.list(params),
    placeholderData: keepPreviousData,
  });
}
