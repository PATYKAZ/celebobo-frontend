"use client";

import { AccountShell } from "@/modules/account/components/AccountShell";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Camera, ShieldTick } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Select, Textarea } from "@/shared/ui/Form";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useClaimable, useSubmitClaim } from "../hooks/useClaims";
import { claimsService } from "../services/claims.service";
import { KIND_HINT, KIND_LABEL, type ClaimKind } from "../types";

const MAX_PHOTOS = 6;

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = Number(params.get("commande")) || undefined;
  const { data: lines, isLoading, isError } = useClaimable(orderId);
  const submit = useSubmitClaim();
  const [itemId, setItemId] = useState<number | null>(null);
  const [kind, setKind] = useState<ClaimKind | null>(null);
  const [serial, setSerial] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [key] = useState(() => crypto.randomUUID());

  const open = useMemo(() => (lines ?? []).filter((l) => l.kinds.length > 0), [lines]);
  const line = open.find((l) => l.itemId === itemId) ?? (open.length === 1 ? open[0] : undefined);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all([...files].slice(0, MAX_PHOTOS - photos.length).map((f) => claimsService.uploadPhoto(f)));
      setPhotos((p) => [...p, ...urls].slice(0, MAX_PHOTOS));
    } catch (e) {
      toast.error("Photo non envoyée", getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    if (!line || !kind) return;
    submit.mutate(
      { input: { orderId: line.orderId, itemId: line.itemId, kind, description, serial: serial || line.serials[0] || "", photos }, key },
      {
        onSuccess: (claim) => {
          toast.success("Réclamation envoyée", "Nous vous répondons sous 72 heures.");
          router.replace(ROUTES.myClaim(claim.id));
        },
        onError: (e) => toast.error("Envoi impossible", getErrorMessage(e)),
      },
    );
  };

  if (!orderId || isError) {
    return <EmptyState icon={<ShieldTick size={44} />} title="Commande introuvable" description="Ouvrez la réclamation depuis une commande livrée, dans Mes commandes." action={<Button href={ROUTES.orders}>Mes commandes</Button>} />;
  }
  if (isLoading || !lines) return <Skeleton className="h-72 w-full rounded-box!" />;
  if (open.length === 0) {
    return <EmptyState icon={<ShieldTick size={44} />} title="Aucune réclamation possible" description="Les délais de cette commande sont dépassés, ou une réclamation est déjà en cours." action={<Button href={ROUTES.myClaims}>Mes réclamations</Button>} />;
  }

  return (
    <div className="space-y-5">
      {open.length > 1 && (
        <Select label="Article concerné" value={line?.itemId ?? ""} onChange={(e) => { setItemId(Number(e.target.value)); setKind(null); setSerial(""); }} options={[{ value: "", label: "Choisissez l'article" }, ...open.map((l) => ({ value: l.itemId, label: l.name }))]} />
      )}
      {line && (
        <>
          <p className="rounded-box bg-primary-50 p-3.5 text-sm text-primary-dark">
            <b>{line.name}</b>
            {line.trialUntil && <> — délai d&apos;essai jusqu&apos;au {formatDate(line.trialUntil)}</>}
            {line.warrantyUntil && <>, garantie CeLE BoBO jusqu&apos;au {formatDate(line.warrantyUntil)}</>}.
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Quel est le problème ?</legend>
            {line.kinds.map((k) => (
              <label key={k} className="flex cursor-pointer gap-3 rounded-box border border-line p-3 has-checked:border-primary has-checked:bg-primary-50/40">
                <input type="radio" name="kind" className="mt-1" checked={kind === k} onChange={() => setKind(k)} />
                <span>
                  <span className="block text-sm font-semibold">{KIND_LABEL[k]}</span>
                  <span className="block text-xs text-ink-3">{KIND_HINT[k]}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {line.serials.length > 1 && (
            <Select label="Numéro de série / IMEI de l'unité" value={serial} onChange={(e) => setSerial(e.target.value)} options={[{ value: "", label: "Choisissez le numéro" }, ...line.serials.map((s) => ({ value: s, label: s }))]} />
          )}
          <Textarea label="Décrivez le problème" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Depuis quand, ce qui se passe, ce que vous avez essayé…" className="min-h-[110px]" />
          <div>
            <p className="mb-2 text-sm font-semibold">Photos du défaut <span className="font-normal text-ink-3">(jusqu&apos;à {MAX_PHOTOS})</span></p>
            <div className="flex flex-wrap gap-2">
              {photos.map((url) => (
                <span key={url} className="relative size-20 overflow-hidden rounded-md bg-page">
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                </span>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-md border border-dashed border-line text-ink-3">
                  <Camera size={22} />
                  <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => addPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>
          <Button fullWidth upper={false} disabled={!kind || description.trim().length < 5 || uploading || (line.serials.length > 1 && !serial)} loading={submit.isPending} onClick={send}>
            Envoyer la réclamation
          </Button>
          <p className="text-xs text-ink-3">Nous vous répondons sous 72 heures et vous indiquons comment rendre le produit : dépôt à la boutique ou reprise par votre revendeur. Gardez votre facture : le numéro de série doit être le même.</p>
        </>
      )}
    </div>
  );
}

export function NewClaimView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mes réclamations", href: ROUTES.myClaims }, { label: "Nouvelle réclamation" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <AccountShell>
        <Reveal>
          <Block pad="none" className="p-4 sm:p-8">
            <h1 className="mb-4 text-xl sm:text-h-page">Faire une réclamation</h1>
            <Content />
          </Block>
        </Reveal>
        </AccountShell>
      </AuthGuard>
    </>
  );
}
