"use client";

import { Star1, TickCircle } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useAddReview, useReviewEligibility } from "../hooks/useProducts";

export function ReviewForm({ slug }: { slug: string }) {
  const { user, isAuthenticated } = useAuth();
  const mutation = useAddReview(slug);
  const eligibility = useReviewEligibility(slug);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-box bg-page/60 p-5 text-center">
        <p className="text-[14px] text-ink-2">Connectez-vous pour donner votre avis sur ce produit.</p>
        <Button href={ROUTES.login(ROUTES.product(slug))} size="sm" className="mt-3">Se connecter</Button>
      </div>
    );
  }

  if (eligibility.isLoading) return <div className="skeleton h-[120px] w-full !rounded-box" />;
  if (!eligibility.data?.canReview) {
    return (
      <div className="flex items-start gap-3 rounded-box bg-page/60 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary"><TickCircle size={20} variant="Bold" /></span>
        <div>
          <h4 className="text-[15px]">Les avis sont réservés aux acheteurs</h4>
          <p className="mt-1 text-[13px] leading-[20px] text-ink-2">{eligibility.data?.reason || "Pour garantir des avis authentiques, vous pourrez noter ce produit une fois votre commande livrée. Les avis publiés portent le badge « Achat vérifié »."}</p>
        </div>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1) return setError("Choisissez une note de 1 à 5.");
    if (message.trim().length < 10) return setError("Votre avis doit contenir au moins 10 caractères.");
    setError(undefined);
    mutation.mutate(
      { rating, message: message.trim() },
      {
        onSuccess: () => {
          toast.success("Merci pour votre avis !");
          setRating(0);
          setMessage("");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-box border border-line-3 p-5">
      <h4 className="flex flex-wrap items-center gap-2 text-[16px]">Donner votre avis <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-dark"><TickCircle size={12} variant="Bold" /> Achat vérifié</span></h4>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="transition-transform hover:scale-125">
            <Star1 size={28} variant="Bold" color={n <= (hover || rating) ? "#FFA500" : "#C9CBD3"} />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-[13px] font-semibold text-ink-2">{rating}/5</span>}
      </div>
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Partagez votre expérience avec ce produit…" maxLength={2000} error={error} className={cn(error && "field-error")} />
      <Button type="submit" loading={mutation.isPending} className="self-start" upper={false}>Publier mon avis</Button>
    </form>
  );
}
