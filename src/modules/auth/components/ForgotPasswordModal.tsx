"use client";

import { Sms, TickCircle } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { authService } from "../services/auth.service";

export function ForgotPasswordModal({ open, onClose, initialEmail = "" }: { open: boolean; onClose: () => void; initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const close = () => {
    onClose();
    setTimeout(() => setSent(false), 300);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Adresse e-mail invalide.");
    setError(undefined);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Mot de passe oublié">
      {sent ? (
        <div className="py-4 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-100 text-primary"><TickCircle size={34} variant="Bold" /></span>
          <p className="mt-4 text-[14px] leading-[22px] text-ink-2">Si un compte existe pour <strong className="text-ink">{email}</strong>, un lien de réinitialisation vient de vous être envoyé.</p>
          <Button className="mt-6" onClick={close} upper={false}>Fermer</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-[14px] leading-[22px] text-ink-2">Saisissez l&apos;adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} leftIcon={<Sms size={17} />} autoFocus />
          <Button type="submit" loading={loading} fullWidth>Envoyer le lien</Button>
        </form>
      )}
    </Modal>
  );
}
