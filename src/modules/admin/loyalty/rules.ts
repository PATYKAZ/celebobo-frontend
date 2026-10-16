"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";

const { loyalty } = ENDPOINTS.admin;

/** Déclencheurs TCA — mêmes valeurs et mêmes libellés que le backend (domain/rules.py). */
export type LoyaltyTrigger =
  | "user_registered"
  | "user_login_daily"
  | "newsletter_subscribed"
  | "profile_completed"
  | "first_purchase"
  | "purchase_made"
  | "order_value_milestone"
  | "product_purchased"
  | "category_purchased"
  | "review_created"
  | "friend_referred"
  | "social_shared"
  | "birthday_reached"
  | "winback_inactivity";

export const TRIGGER_LABELS: Record<LoyaltyTrigger, string> = {
  user_registered: "Inscription",
  user_login_daily: "Connexion quotidienne",
  newsletter_subscribed: "Abonnement newsletter",
  profile_completed: "Profil complété",
  first_purchase: "Premier achat",
  purchase_made: "Achat effectué",
  order_value_milestone: "Seuil de montant de commande",
  product_purchased: "Produit acheté",
  category_purchased: "Catégorie achetée",
  review_created: "Avis produit déposé",
  friend_referred: "Parrainage d'ami",
  social_shared: "Partage sur réseau social",
  birthday_reached: "Anniversaire",
  winback_inactivity: "Retour après inactivité",
};

export const TRIGGERS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value: value as LoyaltyTrigger, label }));

/** Déclencheurs dont la condition attend un montant de commande minimum. */
export const AMOUNT_TRIGGERS: LoyaltyTrigger[] = ["first_purchase", "purchase_made", "order_value_milestone"];

/** Conditions lues par le moteur de règles (camelCase après conversion de l'API). */
export interface RuleCondition {
  minAmount?: number;
  daysInactive?: number;
  photoRequired?: boolean;
  productId?: number;
  categoryId?: number;
}

/** `/bo/loyalty/rules/` (après camelCase). */
export interface LoyaltyRule {
  id: number;
  name: string;
  trigger: LoyaltyTrigger;
  condition: RuleCondition;
  pointsValue: number;
  isActive: boolean;
  maxPerUser: number | null;
  maxPerDay: number | null;
  cooldownDays: number | null;
}

/** Champs du formulaire (chaînes pour les nombres). */
export interface RuleFormValues {
  name: string;
  trigger: LoyaltyTrigger;
  pointsValue: string;
  isActive: boolean;
  maxPerUser: string;
  maxPerDay: string;
  cooldownDays: string;
  minAmount: string;
  daysInactive: string;
  photoRequired: boolean;
  productId: number | null;
  categoryId: number | null;
}

export const emptyRule = (): RuleFormValues => ({
  name: "",
  trigger: "user_registered",
  pointsValue: "",
  isActive: true,
  maxPerUser: "",
  maxPerDay: "",
  cooldownDays: "",
  minAmount: "",
  daysInactive: "",
  photoRequired: false,
  productId: null,
  categoryId: null,
});

export const ruleToForm = (r: LoyaltyRule): RuleFormValues => ({
  ...emptyRule(),
  name: r.name,
  trigger: r.trigger,
  pointsValue: String(r.pointsValue),
  isActive: r.isActive,
  maxPerUser: r.maxPerUser == null ? "" : String(r.maxPerUser),
  maxPerDay: r.maxPerDay == null ? "" : String(r.maxPerDay),
  cooldownDays: r.cooldownDays == null ? "" : String(r.cooldownDays),
  minAmount: r.condition.minAmount == null ? "" : String(r.condition.minAmount),
  daysInactive: r.condition.daysInactive == null ? "" : String(r.condition.daysInactive),
  photoRequired: !!r.condition.photoRequired,
  productId: r.condition.productId ?? null,
  categoryId: r.condition.categoryId ?? null,
});

const int = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);

/** Corps POST / PATCH `/bo/loyalty/rules/` — la condition dépend du déclencheur choisi. */
const toPayload = (v: RuleFormValues) => {
  const condition: RuleCondition = {};
  const minAmount = int(v.minAmount);
  const daysInactive = int(v.daysInactive);
  if (AMOUNT_TRIGGERS.includes(v.trigger) && minAmount != null) condition.minAmount = minAmount;
  if (v.trigger === "winback_inactivity" && daysInactive != null) condition.daysInactive = daysInactive;
  if (v.trigger === "review_created" && v.photoRequired) condition.photoRequired = true;
  if (v.trigger === "product_purchased" && v.productId) condition.productId = v.productId;
  if (v.trigger === "category_purchased" && v.categoryId) condition.categoryId = v.categoryId;
  return {
    name: v.name.trim(),
    trigger: v.trigger,
    pointsValue: int(v.pointsValue),
    isActive: v.isActive,
    maxPerUser: int(v.maxPerUser),
    maxPerDay: int(v.maxPerDay),
    cooldownDays: int(v.cooldownDays),
    condition,
  };
};

export const loyaltyRulesKey = ["admin", "loyalty", "rules"] as const;

export function useLoyaltyRules() {
  return useQuery({
    queryKey: loyaltyRulesKey,
    queryFn: async () => (await api.page<LoyaltyRule>(loyalty.rules.list, { params: { pageSize: 100 } })).results,
  });
}

/** La création renvoie la règle ; le backend refuse le changement de déclencheur (cf. vues), omis en modification. */
export function useSaveRule(rule: LoyaltyRule | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: loyaltyRulesKey });
  return useMutation({
    mutationFn: async (v: RuleFormValues) => {
      const { trigger: _trigger, ...payload } = toPayload(v);
      return rule ? api.patch<LoyaltyRule>(loyalty.rules.detail(rule.id), payload) : api.post<LoyaltyRule>(loyalty.rules.list, toPayload(v));
    },
    onSuccess: invalidate,
  });
}

export function usePatchRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.patch<LoyaltyRule>(loyalty.rules.detail(id), { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: loyaltyRulesKey }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(loyalty.rules.detail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: loyaltyRulesKey }),
  });
}
