"use client";

import { useRef, useState } from "react";
import { DocumentDownload, DocumentUpload, TickCircle, CloseCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Overlay";
import { Spinner } from "@/shared/ui/Spinner";
import { toast } from "@/shared/ui/Toast";
import { useImportProducts } from "../hooks/useAdminProducts";
import type { ImportSummary } from "../services/admin-products.service";
import { CSV_HEADERS, CSV_REQUIRED, CSV_TEMPLATE, downloadText } from "../utils/csv";

/** Import CSV : choix du fichier → simulation par l'API (erreurs par ligne) → confirmation de l'import réel. */
export function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const imp = useImportProducts();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [drag, setDrag] = useState(false);

  const valid = preview ? preview.created + preview.updated : 0;

  const reset = () => {
    setFile(null);
    setPreview(null);
    imp.reset();
  };
  const close = () => {
    reset();
    onClose();
  };

  const take = (picked?: File | null) => {
    if (!picked) return;
    if (!/\.(csv|txt)$/i.test(picked.name)) return toast.error("Format non pris en charge", "Importez un fichier .csv");
    setFile(picked);
    setPreview(null);
    imp.mutate(
      { file: picked, dryRun: true },
      {
        onSuccess: setPreview,
        onError: (e) => {
          setFile(null);
          toast.error("Fichier refusé", getErrorMessage(e));
        },
      },
    );
  };

  const confirm = () =>
    file &&
    imp.mutate(
      { file, dryRun: false },
      {
        onSuccess: (res) => {
          toast.success("Import terminé", `${res.created} créé(s), ${res.updated} mis à jour${res.errorCount ? `, ${res.errorCount} ligne(s) ignorée(s)` : ""}`);
          close();
        },
        onError: (e) => toast.error("Import impossible", getErrorMessage(e)),
      },
    );

  return (
    <Modal open={open} onClose={close} title="Importer des produits (CSV)" className="max-w-[920px]">
      <div className="grid gap-4">
        {!file ? (
          <>
            <div
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
              className={cn("grid cursor-pointer place-items-center gap-2 rounded-box border-2 border-dashed px-4 py-9 text-center transition-all sm:px-6 sm:py-12", drag ? "scale-[1.01] border-primary bg-primary-50" : "border-line bg-page/40 hover:border-primary")}
            >
              <DocumentUpload size={40} variant="Bulk" className="text-primary" />
              <p className="text-[15px] font-bold"><span className="sm:hidden">Touchez pour choisir un fichier CSV</span><span className="hidden sm:inline">Déposez votre fichier CSV ici ou cliquez pour parcourir</span></p>
              <p className="text-[13px] text-ink-3">Séparateur « ; » ou « , » · encodage UTF-8 · une ligne par produit</p>
              <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="rounded-box bg-page/60 p-4 text-[13px] text-ink-2">
              <p className="font-semibold text-ink">Colonnes attendues</p>
              <p className="mt-1 break-words font-mono text-[12px]">{CSV_HEADERS.join(" ; ")}</p>
              <p className="mt-2">Obligatoires : <strong>{CSV_REQUIRED.join(", ")}</strong> (catégorie : son slug, ex. smartphones). Avec un <strong>slug</strong> existant, la ligne met à jour le produit ; sans slug, elle le crée.</p>
              <Button variant="chip" size="sm" upper={false} className="mt-3" leftIcon={<DocumentDownload size={16} />} onClick={() => downloadText("modele-produits.csv", CSV_TEMPLATE)}>Télécharger le modèle</Button>
            </div>
          </>
        ) : !preview ? (
          <div className="grid min-h-[200px] place-items-center gap-3 text-center">
            <Spinner size={28} />
            <p className="text-[14px] text-ink-2">Vérification de « {file.name} »…</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <p className="font-semibold">{file.name} · {preview.rows} ligne{preview.rows > 1 ? "s" : ""}</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-primary-dark"><TickCircle size={16} variant="Bold" /> {preview.created} création{preview.created > 1 ? "s" : ""} · {preview.updated} mise{preview.updated > 1 ? "s" : ""} à jour</span>
                <span className={cn("inline-flex items-center gap-1", preview.errorCount ? "text-danger" : "text-ink-3")}><CloseCircle size={16} variant="Bold" /> {preview.errorCount} en erreur</span>
                <button onClick={reset} className="text-[13px] font-semibold text-primary hover:underline">Changer de fichier</button>
              </div>
            </div>
            {preview.errors.length > 0 && (
              <ul className="grid max-h-[46vh] gap-2 overflow-y-auto">
                {preview.errors.map((r) => (
                  <li key={r.row} className="rounded-box border border-danger/30 bg-danger-50/60 p-3 text-[13px]">
                    <p className="font-bold">Ligne {r.row}</p>
                    <ul className="mt-1 space-y-0.5 text-[12px] text-danger">{Object.entries(r.errors).map(([field, msg]) => <li key={field}>• {field !== "row" ? `${field} : ` : ""}{msg}</li>)}</ul>
                  </li>
                ))}
              </ul>
            )}
            {preview.errorCount > 0 && <p className="text-[12px] text-ink-3">Les lignes en erreur seront ignorées. Corrigez-les dans le fichier puis réimportez-les.</p>}
          </>
        )}
        <div className="grid grid-cols-[1fr_1.5fr] gap-3 sm:ml-auto sm:w-[360px] sm:grid-cols-2">
          <Button variant="chip" upper={false} onClick={close}>Annuler</Button>
          <Button upper={false} disabled={!valid} loading={imp.isPending && !!preview} onClick={confirm}>Importer {valid ? `(${valid})` : ""}</Button>
        </div>
      </div>
    </Modal>
  );
}
