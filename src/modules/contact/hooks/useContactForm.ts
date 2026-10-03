"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { toast } from "@/shared/ui/Toast";
import { contactService } from "../services/contact.service";
import type { ContactErrors, ContactInput, ContactReceipt } from "../types";

const EMPTY: ContactInput = { name: "", email: "", phone: "", subject: "order", message: "" };

export function validateContact(v: ContactInput): ContactErrors {
  const e: ContactErrors = {};
  if (v.name.trim().length < 2) e.name = "Entrez votre nom complet.";
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = "Adresse e-mail invalide.";
  if (v.phone && !/^\+?[\d\s().-]{7,20}$/.test(v.phone.trim())) e.phone = "Numéro de téléphone invalide.";
  if (v.message.trim().length < 10) e.message = "Votre message doit contenir au moins 10 caractères.";
  return e;
}

export function useContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [receipt, setReceipt] = useState<(ContactReceipt & { input: ContactInput }) | null>(null);
  const mutation = useMutation({ mutationFn: contactService.send });

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as keyof ContactInput]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateContact(values);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    mutation.mutate(values, {
      onSuccess: (r) => {
        setReceipt({ ...r, input: values });
        setValues(EMPTY);
        toast.success("Message envoyé", "Nous vous répondons sous 24 h.");
      },
      onError: (err) => {
        if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
          const fe = err.fieldErrors;
          setErrors(Object.fromEntries(Object.entries(fe).map(([k, m]) => [k, Array.isArray(m) ? m[0] : m])) as ContactErrors);
        } else toast.error("Envoi impossible", getErrorMessage(err, "Réessayez dans un instant."));
      },
    });
  };

  return { values, errors, sent: !!receipt, receipt, loading: mutation.isPending, onChange, onSubmit, reset: () => setReceipt(null) };
}
