"use client";

import { useMutation } from "@tanstack/react-query";
import { newsletterService } from "../services/newsletter.service";

export function useNewsletterSubscribe() {
  return useMutation({ mutationFn: (email: string) => newsletterService.subscribe(email) });
}
