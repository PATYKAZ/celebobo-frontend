"use client";

import { useState } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { useCreateConversation } from "../hooks/useConversations";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

/** Nouvelle discussion de support : sujet (optionnel) + premier message (obligatoire côté API). */
export function NewConversationSheet({ open, onClose, onCreated }: Props) {
  const create = useCreateConversation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();

  const submit = () => {
    if (!message.trim()) return setError("Écrivez votre message.");
    setError(undefined);
    create.mutate(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: (c) => {
          setSubject("");
          setMessage("");
          onClose();
          onCreated(c.id);
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nouvelle discussion">
      <div className="space-y-4 pb-2 pt-1">
        <p className="text-[13px] leading-[19px] text-ink-2">Une question sur un produit, une livraison ou votre compte ? Notre équipe vous répond ici.</p>
        <Input label="Sujet (optionnel)" value={subject} maxLength={160} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. : garantie d'un smartphone" />
        <Textarea label="Message" value={message} maxLength={4000} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre demande…" className="min-h-[110px]" error={error} />
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} loading={create.isPending} onClick={submit}>Envoyer</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
