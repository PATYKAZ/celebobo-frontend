"use client";

import { AccountShell } from "@/modules/account/components/AccountShell";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Spinner } from "@/shared/ui/Spinner";
import { toast } from "@/shared/ui/Toast";
import { DocumentDownload, InfoCircle, ShieldTick, TickCircle } from "@/shared/ui/icons";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { useDataExport, useRequestDataExport } from "../hooks/useDataExport";
import { dataExportService } from "../services/data-export.service";
import type { DataExportJob } from "../types";

const INCLUDED = [
  "Votre compte : profil, e-mail, téléphone, adresses, parrainage (qui vous a invité et quand).",
  "Vos commandes : articles, prix, livraison, paiements, remboursements, factures et reçus.",
  "Vos points de fidélité : solde et historique.",
  "Vos avis, vos favoris et vos préférences de notification.",
  "Vos discussions avec le service client et les revendeurs.",
];

const sizeLabel = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`);

function download(job: DataExportJob) {
  const a = document.createElement("a");
  a.href = dataExportService.downloadUrl(job.id);
  a.download = job.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** État du dernier export : en préparation, prêt (avec le lien), expiré ou en échec. */
function ExportState({ job }: { job: DataExportJob }) {
  if (job.status === "pending" || job.status === "running")
    return (
      <div className="flex items-center gap-3 rounded-box bg-chip p-3.5 text-sm text-ink-2 sm:p-4 sm:text-sm">
        <Spinner size={20} className="shrink-0 text-primary" />
        <span>Préparation de votre fichier… Vous pouvez quitter cette page : il vous attendra ici.</span>
      </div>
    );
  if (job.status === "failed")
    return <p className="rounded-box bg-danger-50 p-3.5 text-sm text-danger sm:p-4 sm:text-sm">La préparation de votre fichier a échoué. Vous pourrez relancer la demande dans quelques minutes.</p>;
  if (!job.downloadable)
    return <p className="rounded-box bg-chip p-3.5 text-sm text-ink-2 sm:p-4 sm:text-sm">Le lien de votre dernier fichier a expiré. Demandez un nouvel export.</p>;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-box bg-primary-50 p-3.5 text-sm text-primary-dark sm:p-4 sm:text-sm">
      <TickCircle size={22} variant="Bold" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">Votre fichier est prêt ({sizeLabel(job.size)})</p>
        {job.expiresAt && <p className="text-xs sm:text-sm">Lien valable jusqu&apos;au {formatDateTime(job.expiresAt)}.</p>}
      </div>
      <Button size="sm" leftIcon={<DocumentDownload size={16} />} onClick={() => download(job)} className="max-sm:w-full">
        Télécharger le fichier
      </Button>
    </div>
  );
}

function Content() {
  const { user } = useAuth();
  const { data, isLoading } = useDataExport();
  const request = useRequestDataExport();
  const job = data?.job ?? null;
  const preparing = job?.status === "pending" || job?.status === "running";
  const waitUntil = data?.availableAt && new Date(data.availableAt) > new Date() ? data.availableAt : null;
  const included = user?.role === "revendeur" ? [...INCLUDED, "Votre activité de revendeur : ventes, commissions, relevés et paiements."] : INCLUDED;

  const ask = () =>
    request.mutate(undefined, {
      onSuccess: () => toast.success("Demande enregistrée", "Votre fichier est en préparation."),
      onError: (e) => toast.error(e instanceof ApiError && e.code === "personal_data_export_too_soon" ? "Demande trop rapprochée" : "Demande impossible", getErrorMessage(e)),
    });

  return (
    <Reveal>
      <Block pad="none" className="p-4 sm:p-8">
        <h1 className="text-xl sm:text-h-page">Mes données</h1>
        <p className="mt-1 text-sm text-ink-2 sm:text-sm">
          Téléchargez une copie des données que Celebobo garde sur votre compte, dans un fichier ZIP : une page à ouvrir dans votre navigateur et un fichier JSON pour les conserver ou les transmettre à un autre service.
        </p>

        <div className="mt-4 rounded-box border border-line-3 p-4 sm:mt-6 sm:p-5">
          <p className="text-sm font-bold">Ce que contient le fichier</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2 sm:text-sm">
            {included.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3 sm:text-sm">Les coordonnées des autres personnes (revendeurs, autres clients) n&apos;y figurent pas. Le lien de téléchargement reste valable 48 heures ; vous pouvez demander un nouvel export une fois par heure (10 minutes après un échec).</p>
        </div>

        <div className="mt-4 space-y-3 sm:mt-6">
          {isLoading ? <Skeleton className="h-16 rounded-box!" /> : job && <ExportState job={job} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button leftIcon={<DocumentDownload size={18} />} loading={request.isPending} disabled={isLoading || preparing || !!waitUntil} onClick={ask} className="max-sm:w-full">
              {job?.downloadable ? "Préparer un nouvel export" : "Télécharger mes données"}
            </Button>
            {waitUntil && <span className="text-sm text-ink-3">Nouvelle demande possible à partir du {formatDateTime(waitUntil)}.</span>}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-box bg-page/60 p-3.5 text-sm text-ink-2 sm:p-4 sm:text-sm">
          <ShieldTick size={22} variant="Bold" className="mt-0.5 shrink-0 text-primary" />
          <p>
            Vous pouvez aussi, gratuitement, demander l&apos;accès à vos données, leur correction ou leur effacement : nous accusons réception sous 72 heures et répondons dans les 30 jours. La marche à suivre est dans notre{" "}
            <Link href={ROUTES.page("politique-de-confidentialite")} className="font-semibold text-primary underline">
              politique de confidentialité
            </Link>
            . Écrivez à{" "}
            <a href="mailto:celestinbahiga@gmail.com" className="font-semibold text-primary underline">
              celestinbahiga@gmail.com
            </a>{" "}
            avec « Données personnelles » en objet.
          </p>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-3">
          <InfoCircle size={14} className="shrink-0" /> Gardez ce fichier en lieu sûr : il contient vos informations personnelles.
        </p>
      </Block>
    </Reveal>
  );
}

export function MyDataView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mes données" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <AccountShell>
        <Content />
        </AccountShell>
      </AuthGuard>
    </>
  );
}
