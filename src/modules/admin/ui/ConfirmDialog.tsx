"use client";

import { Warning2 } from "iconsax-reactjs";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Overlay";

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

/** Confirmation : feuille ancrée en bas sur mobile (boutons empilés 48px, action principale en premier), modale centrée en desktop. */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", loading, tone = "danger" }: Props) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-[440px]">
      <div className="flex flex-col items-center text-center">
        <span className={`grid size-14 place-items-center rounded-full sm:size-16 ${tone === "danger" ? "bg-danger-100 text-danger" : "bg-primary-100 text-primary"}`}>
          <Warning2 size={28} variant="Bold" />
        </span>
        <h3 className="mt-3 text-[18px] leading-[26px] sm:mt-4 sm:text-[20px] sm:leading-[28px]">{title}</h3>
        <p className="mt-2 text-[14px] leading-[22px] text-ink-2">{message}</p>
        <div className="mt-5 flex w-full flex-col-reverse gap-2.5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
          <Button variant="chip" onClick={onClose} upper={false}>Annuler</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} upper={false}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
