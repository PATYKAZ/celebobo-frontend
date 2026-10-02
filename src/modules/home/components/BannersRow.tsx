"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/shared/animations/Reveal";
import { Float } from "@/shared/animations/MotionImage";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/ui/Toast";

function CashbackBanner() {
  return (
    <Reveal className="h-full">
      <div className="group relative flex min-h-[180px] items-center overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/products/charger.jpg" alt="" fill sizes="646px" className="object-cover opacity-70 transition-transform duration-[900ms] group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/90 via-primary/70 to-black/60" />
        <div className="relative ml-auto w-full max-w-[300px] px-6 py-8 sm:mr-12 sm:px-0">
          <Float slow>
            <p className="text-[34px] font-bold leading-[42px] text-sun sm:text-[40px] sm:leading-[48px]">10 % cashback</p>
          </Float>
          <p className="mt-3 text-[14px] leading-[19.6px] text-white">
            Gagnez 10 % de cashback sur vos achats Celebobo. <u className="cursor-pointer underline-offset-4">En savoir plus</u>
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function AppBanner() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\+?[0-9\s]{9,16}$/.test(phone.trim())) {
      setError("Entrez un numéro valide (ex: +243 970 000 000)");
      return;
    }
    setError("");
    setLoading(true);
    // TODO(api): POST /app-link/ { phone }
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setPhone("");
    toast.success("Lien envoyé !", "Vous allez recevoir le lien de téléchargement par SMS.");
  };

  return (
    <Reveal className="h-full">
      <div className="group relative min-h-[180px] overflow-hidden rounded-box bg-ink-dark">
        <Image src="/images/hero/hero-2.jpg" alt="" fill sizes="646px" className="object-cover opacity-50 transition-transform duration-[900ms] group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="relative grid gap-4 px-5 py-6 sm:grid-cols-[auto_1fr] sm:gap-5 sm:px-10 sm:py-8">
          <h3 className="text-[24px] font-medium leading-[28.8px] text-white">
            Téléchargez<br />notre app
          </h3>
          <div>
            <p className="text-[12px] leading-[20.4px] text-line">Entrez votre numéro de téléphone et nous vous enverrons un lien de téléchargement.</p>
            <form onSubmit={submit} noValidate className="mt-3">
              <div className={cn("flex min-w-0 flex-col gap-2 sm:h-[38px] sm:flex-row sm:items-center sm:gap-0 sm:overflow-hidden sm:rounded-[5px] sm:bg-white/[.12] sm:ring-1 sm:transition-all sm:focus-within:bg-white/20", error ? "sm:ring-danger" : "sm:ring-transparent sm:focus-within:ring-primary-light")}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(+243) 000 000 000"
                  aria-label="Numéro de téléphone"
                  inputMode="tel"
                  className={cn("h-12 w-full min-w-0 shrink-0 rounded-[8px] bg-white/[.14] sm:flex-1 px-3 text-[16px] text-white outline-none ring-1 placeholder:text-ink-3 focus:bg-white/20 sm:h-full sm:rounded-none sm:bg-transparent sm:text-[14px] sm:ring-0", error ? "ring-danger" : "ring-transparent focus:ring-primary-light")}
                />
                <button disabled={loading} className="h-12 w-full rounded-[8px] bg-primary px-5 text-[13px] font-bold uppercase leading-[18px] text-white transition-opacity active:scale-[0.98] disabled:opacity-50 sm:h-full sm:w-auto sm:rounded-none sm:bg-transparent sm:text-[12px] sm:font-semibold sm:text-primary-light sm:hover:opacity-80">
                  {loading ? "…" : "Envoyer"}
                </button>
              </div>
              {error && <p role="alert" className="mt-1.5 text-[12px] text-danger">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function BannersRow() {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-2">
      <CashbackBanner />
      <AppBanner />
    </section>
  );
}
