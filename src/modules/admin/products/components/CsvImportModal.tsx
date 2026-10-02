"use client";

import { useMemo, useRef, useState } from "react";
import { DocumentDownload, DocumentUpload, TickCircle, CloseCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useAdminCategories } from "../../categories/hooks/useAdminCategories";
import { useAdminProducts, useImportProducts } from "../hooks/useAdminProducts";
import { CSV_HEADERS, CSV_TEMPLATE, downloadText, parseCsv, validateImport, type ImportRow } from "../utils/csv";

/** Import CSV : choix du fichier → analyse côté client → aperçu avec erreurs par ligne → confirmation. */
export function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { data: categories } = useAdminCategories(open);
  const { data: all } = useAdminProducts({ all: true, status: "active" }, open);
  const imp = useImportProducts();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const ids = useMemo(() => new Set((all?.results ?? []).map((p) => p.id)), [all]);
  const valid = rows?.filter((r) => r.data) ?? [];
  const invalid = rows?.filter((r) => !r.data) ?? [];

  const reset = () => {
    setFileName("");
    setRows(null);
    setMissing([]);
  };
  const close = () => {
    reset();
    onClose();
  };

  const take = async (file?: File | null) => {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) return toast.error("Format non pris en charge", "Importez un fichier .csv");
    const text = await file.text();
    const res = validateImport(parseCsv(text), categories ?? [], ids);
    setFileName(file.name);
    setRows(res.rows);
    setMissing(res.missingColumns);
  };

  const confirm = () =>
    imp.mutate(
      valid.map((r) => ({ id: r.id, data: r.data! })),
      {
        onSuccess: (res) => {
          toast.success("Import terminé", `${res.created} créé(s), ${res.updated} mis à jour`);
          close();
        },
        onError: (e) => toast.error("Import impossible", getErrorMessage(e)),
      },
    );

  return (
    <Modal open={open} onClose={close} title="Importer des produits (CSV)" className="max-w-[920px]">
      <div className="grid gap-4">
        {!rows ? (
          <>
            <div
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); void take(e.dataTransfer.files?.[0]); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
              className={cn("grid cursor-pointer place-items-center gap-2 rounded-box border-2 border-dashed px-6 py-12 text-center transition-all", drag ? "scale-[1.01] border-primary bg-primary-50" : "border-line bg-page/40 hover:border-primary")}
            >
              <DocumentUpload size={40} variant="Bulk" className="text-primary" />
              <p className="text-[15px] font-bold">Déposez votre fichier CSV ici ou cliquez pour parcourir</p>
              <p className="text-[13px] text-ink-3">Séparateur « ; » ou « , » · encodage UTF-8 · une ligne par produit</p>
              <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="rounded-box bg-page/60 p-4 text-[13px] text-ink-2">
              <p className="font-semibold text-ink">Colonnes attendues</p>
              <p className="mt-1 break-words font-mono text-[12px]">{CSV_HEADERS.join(" ; ")}</p>
              <p className="mt-2">Obligatoires : <strong>nom, description (20-100 car.), categorie, prix</strong>. Avec un <strong>id</strong> existant, la ligne met à jour le produit ; sans id, elle le crée.</p>
              <Button variant="chip" size="sm" upper={false} className="mt-3" leftIcon={<DocumentDownload size={16} />} onClick={() => downloadText("modele-produits.csv", CSV_TEMPLATE)}>Télécharger le modèle</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <p className="font-semibold">{fileName}</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-primary-dark"><TickCircle size={16} variant="Bold" /> {valid.length} valide{valid.length > 1 ? "s" : ""}</span>
                <span className={cn("inline-flex items-center gap-1", invalid.length ? "text-danger" : "text-ink-3")}><CloseCircle size={16} variant="Bold" /> {invalid.length} en erreur</span>
                <button onClick={reset} className="text-[13px] font-semibold text-primary hover:underline">Changer de fichier</button>
              </div>
            </div>
            {missing.length > 0 && <p role="alert" className="rounded-box bg-danger-50 p-3 text-[13px] text-danger">Colonnes obligatoires manquantes : {missing.join(", ")}.</p>}
            <div className="max-h-[380px] overflow-auto rounded-box border border-line">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead className="sticky top-0 bg-page text-left text-[11px] uppercase tracking-wide text-ink-3">
                  <tr><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Produit</th><th className="px-3 py-2">Catégorie</th><th className="px-3 py-2 text-right">Prix</th><th className="px-3 py-2 text-right">Stock</th><th className="px-3 py-2">Contrôle</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className={cn("border-t border-line-3", !r.data && "bg-danger-50/60")}>
                      <td className="px-3 py-2 tabular-nums text-ink-3">{r.line}</td>
                      <td className="px-3 py-2">{r.data ? <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", r.id ? "bg-info/10 text-info" : "bg-primary-100 text-primary-dark")}>{r.id ? "Mise à jour" : "Création"}</span> : "—"}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 font-semibold">{r.raw.nom || "—"}</td>
                      <td className="px-3 py-2">{r.raw.categorie || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.data ? formatPrice(r.data.price) : r.raw.prix || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.data ? r.data.stock : r.raw.stock || "—"}</td>
                      <td className="px-3 py-2 text-[12px]">{r.errors.length ? <ul className="space-y-0.5 text-danger">{r.errors.map((e) => <li key={e}>• {e}</li>)}</ul> : <span className="text-primary-dark">OK</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invalid.length > 0 && <p className="text-[12px] text-ink-3">Les lignes en erreur seront ignorées. Corrigez-les dans le fichier puis réimportez-les.</p>}
          </>
        )}
        <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:w-[360px]">
          <Button variant="chip" upper={false} onClick={close}>Annuler</Button>
          <Button upper={false} disabled={!valid.length || missing.length > 0} loading={imp.isPending} onClick={confirm}>Importer {valid.length ? `(${valid.length})` : ""}</Button>
        </div>
      </div>
    </Modal>
  );
}
