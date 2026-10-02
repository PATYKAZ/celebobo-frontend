"use client";

import { Lock, ReceiptItem } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Button, type ButtonVariant } from "@/shared/ui/Button";
import { useCan } from "@/modules/auth/hooks/useCan";
import { useConvertibleOrder } from "../hooks/useSales";

/**
 * Bouton « Convertir en ventes » à placer sur le détail d'une commande.
 * Masqué sans la permission `sales.convert` ; désactivé (avec la raison) si la commande est déjà convertie ou annulée.
 */
export function ConvertOrderButton({ orderId, variant = "primary", className }: { orderId: number; variant?: ButtonVariant; className?: string }) {
  const allowed = useCan("sales.convert");
  const { data, isLoading } = useConvertibleOrder(allowed ? orderId : undefined);
  if (!allowed) return null;

  if (data && !data.convertible) {
    return (
      <Button variant="chip" disabled upper={false} title={data.blockedReason ?? undefined} leftIcon={<Lock size={16} variant="Bold" />} className={className}>
        {data.blockedReason ?? "Non convertible"}
      </Button>
    );
  }
  return (
    <Button href={`${ROUTES.admin.saleConvert}?order=${orderId}`} variant={variant} upper={false} loading={isLoading} leftIcon={<ReceiptItem size={17} variant="Bold" />} className={className}>
      Convertir en ventes
    </Button>
  );
}
