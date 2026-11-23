"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { CloseCircle, DocumentText, ShieldTick } from "@/shared/ui/icons";
import { receiptsService } from "../services/receipts.service";

const SIGNATURE = /^[0-9a-f]{64}$/;

/**
 * Vérification publique d'un reçu de livraison : numéro + signature imprimés en bas du PDF.
 * Le lien du reçu (`?numero=…&signature=…`) lance la vérification à l'ouverture.
 */
export function ReceiptVerificationView() {
  const params = useSearchParams();
  const verify = useMutation({ mutationFn: ({ number, signature }: { number: string; signature: string }) => receiptsService.verify(number, signature) });
  const [number, setNumber] = useState(params.get("numero") ?? "");
  const [signature, setSignature] = useState(params.get("signature") ?? "");
  const [errors, setErrors] = useState<{ number?: string; signature?: string }>({});
  const started = useRef(false);

  const run = (n: string, s: string) => {
    const cleanSignature = s.replace(/\s/g, "").toLowerCase();
    const found: typeof errors = {};
    if (!n.trim()) found.number = "Entrez le numéro du reçu (ex : R-CB-7KQ2-M9XA).";
    if (!SIGNATURE.test(cleanSignature)) found.signature = "La signature compte 64 caractères (chiffres et lettres a à f).";
    setErrors(found);
    if (Object.keys(found).length === 0) verify.mutate({ number: n, signature: cleanSignature });
  };

  // ouvert depuis le lien imprimé sur le reçu : vérifie tout de suite
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const n = params.get("numero");
    const s = params.get("signature")?.replace(/\s/g, "").toLowerCase();
    if (n && s && SIGNATURE.test(s)) verify.mutate({ number: n, signature: s });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(number, signature);
  };

  const result = verify.data;

  return (
    <>
      <Breadcrumb items={[{ label: "Vérifier un reçu de livraison" }]} />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
        <Reveal direction="up" className="min-w-0">
          <Block pad="none" className="h-full p-4 sm:p-8">
            <span className="grid size-12 place-items-center rounded-full bg-primary-100 text-primary-dark sm:size-14"><DocumentText size={26} variant="Bold" /></span>
            <h1 className="mt-3 text-xl sm:mt-4 sm:text-h-page">Vérifier un reçu</h1>
            <p className="mb-5 mt-1 text-sm text-ink-2 sm:mb-6 sm:text-sm">
              Chaque reçu de livraison Celebobo est signé. Recopiez le numéro et la signature imprimés en bas du reçu pour vérifier qu&apos;il est authentique et n&apos;a pas été modifié.
            </p>
            <form onSubmit={submit} noValidate className="space-y-4">
              <Input
                label="Numéro du reçu"
                required
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  setErrors((x) => ({ ...x, number: undefined }));
                }}
                error={errors.number}
                placeholder="R-CB-7KQ2-M9XA"
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <Textarea
                label="Signature"
                required
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  setErrors((x) => ({ ...x, signature: undefined }));
                }}
                error={errors.signature}
                placeholder="64 caractères, ex : 1065ed1319ef…"
                className="min-h-[84px] font-mono text-sm"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <Button type="submit" fullWidth size="lg" loading={verify.isPending} leftIcon={<ShieldTick size={17} variant="Bold" />}>Vérifier</Button>
            </form>
          </Block>
        </Reveal>

        <Reveal direction="up" className="min-w-0">
          <Block pad="none" className="h-full min-h-[240px] p-4 sm:min-h-[340px] sm:p-8">
            <AnimatePresence mode="wait">
              {result?.valid ? (
                <motion.div key="valid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid h-full place-items-center py-4 text-center">
                  <div>
                    <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-100 text-primary"><ShieldTick size={40} variant="Bold" /></span>
                    <h2 className="mt-5 text-xl">Reçu authentique</h2>
                    <p className="mx-auto mt-2 max-w-[400px] text-sm text-ink-2">Ce reçu a été émis par Celebobo et son contenu n&apos;a pas été modifié.</p>
                    <dl className="mx-auto mt-6 grid max-w-[360px] gap-2 rounded-box bg-page/60 p-4 text-left text-sm">
                      <div className="flex justify-between gap-3"><dt className="text-ink-2">Commande</dt><dd className="font-bold">{result.orderNumber}</dd></div>
                      {result.deliveredAt && <div className="flex justify-between gap-3"><dt className="text-ink-2">Remise au client</dt><dd className="font-semibold">{formatDateTime(result.deliveredAt)}</dd></div>}
                      {result.total != null && <div className="flex justify-between gap-3"><dt className="text-ink-2">Total payé</dt><dd className="font-bold text-primary">{formatPrice(result.total)}</dd></div>}
                    </dl>
                    <p className="mx-auto mt-4 max-w-[400px] text-xs text-ink-3">Comparez ces informations avec celles du reçu : elles doivent être identiques.</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div key="invalid" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid h-full place-items-center py-4 text-center">
                  <div>
                    <span className="mx-auto grid size-20 place-items-center rounded-full bg-danger-100 text-danger"><CloseCircle size={40} variant="Bold" /></span>
                    <h2 className="mt-5 text-xl">Reçu non reconnu</h2>
                    <p className="mx-auto mt-2 max-w-[400px] text-sm text-ink-2">
                      Ce numéro et cette signature ne correspondent à aucun reçu émis par Celebobo. Vérifiez la saisie ; si le problème persiste, ce reçu n&apos;est pas authentique ou a été modifié.
                    </p>
                    <Button href={ROUTES.contact} variant="secondary" className="mt-5" upper={false}>Contacter le support</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full min-h-[220px] place-items-center py-4 text-center sm:min-h-[300px]">
                  <div>
                    <span className="mx-auto grid size-20 place-items-center rounded-full bg-chip text-ink-3"><DocumentText size={36} variant="Bulk" /></span>
                    <h2 className="mt-5 text-lg">Le résultat s&apos;affichera ici</h2>
                    <p className="mx-auto mt-2 max-w-[360px] text-sm text-ink-2">{verify.isError ? getErrorMessage(verify.error) : "Le numéro et la signature figurent en bas de chaque reçu de livraison."}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Block>
        </Reveal>
      </div>
    </>
  );
}
