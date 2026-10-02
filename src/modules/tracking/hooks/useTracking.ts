"use client";

import { useMutation } from "@tanstack/react-query";
import { trackingService } from "../services/tracking.service";
import type { TrackingQuery } from "../types";

export function useTrackOrder() {
  return useMutation({ mutationFn: (q: TrackingQuery) => trackingService.lookup(q) });
}
