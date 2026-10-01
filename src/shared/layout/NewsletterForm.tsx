"use client";

import { ArrowRight, Sms } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { toast } from "@/shared/ui/Toast";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Adresse e-mail invalide");
    setLoading(true);
    // TODO(api): POST /newsletter/subscribe/  { email }
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setEmail("");
    toast.success("Merci !", "Votre code de 10 % arrive par e-mail.");
  };

  return (
    <form onSubmit={submit} className="flex h-[41px] items-center gap-2 border-b border-line">
      <Sms size={20} variant="Bold" />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Entrez votre adresse e-mail"
        aria-label="Adresse e-mail"
        className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-4"
      />
      <button disabled={loading} className="group flex items-center gap-2 text-[14px] font-bold uppercase text-primary disabled:opacity-50">
        {loading ? "…" : "S'abonner"}
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}
