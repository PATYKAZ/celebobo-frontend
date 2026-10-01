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

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", loading, tone = "danger" }: Props) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-[440px]">
      <div className="flex flex-col items-center text-center">
        <span className={`grid size-16 place-items-center rounded-full ${tone === "danger" ? "bg-danger-100 text-danger" : "bg-primary-100 text-primary"}`}>
          <Warning2 size={30} variant="Bold" />
        </span>
        <h3 className="mt-4 text-[20px] leading-[28px]">{title}</h3>
        <p className="mt-2 text-[14px] leading-[22px] text-ink-2">{message}</p>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button variant="chip" onClick={onClose} upper={false}>Annuler</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} upper={false}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
