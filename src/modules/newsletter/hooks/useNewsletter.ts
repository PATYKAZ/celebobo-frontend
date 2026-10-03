"use client";

import { useMutation } from "@tanstack/react-query";
import { newsletterService } from "../services/newsletter.service";

export function useNewsletterSubscribe(source?: string) {
  return useMutation({ mutationFn: (email: string) => newsletterService.subscribe(email, source) });
}

export function useNewsletterUnsubscribe() {
  return useMutation({ mutationFn: (token: string) => newsletterService.unsubscribe(token) });
}
