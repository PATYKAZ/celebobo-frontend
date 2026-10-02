"use client";

import { useMutation } from "@tanstack/react-query";
import { resellerApplicationService } from "../services/reseller-application.service";
import type { ResellerApplicationInput } from "../types";

export function useSubmitResellerApplication() {
  return useMutation({ mutationFn: (input: ResellerApplicationInput) => resellerApplicationService.submit(input) });
}
