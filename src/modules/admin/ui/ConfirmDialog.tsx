"use client";

import { Warning2 } from "@/shared/ui/icons";
import { useReturnFocus } from "@/shared/hooks/useReturnFocus";
import { Button } from "@/shared/ui/Button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
}

/**
 * Confirmation (AlertDialog) : feuille ancrée en bas sur mobile (boutons empilés 48px, action principale en premier),
 * modale centrée en desktop. Focus initial sur « Annuler » ; pendant `loading`, Échap ne ferme pas.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", loading, tone = "danger" }: Props) {
  const returnFocus = useReturnFocus(open);
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <AlertDialogContent onEscapeKeyDown={(e) => loading && e.preventDefault()} onCloseAutoFocus={returnFocus}>
        <AlertDialogHeader>
          <AlertDialogMedia className={tone === "danger" ? "bg-danger-100 text-danger" : "bg-primary-100 text-primary"}>
            <Warning2 size={28} variant="Bold" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="chip" upper={false} disabled={loading}>Annuler</Button>
          </AlertDialogCancel>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} upper={false}>{confirmLabel}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
