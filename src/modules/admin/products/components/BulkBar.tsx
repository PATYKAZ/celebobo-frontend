"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Category2, CloseCircle, Eye, EyeSlash, Refresh2, Tag, Trash } from "iconsax-reactjs";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { useAdminCategories } from "../../categories/hooks/useAdminCategories";
import type { BulkAction, ProductStatusFilter } from "../types";

interface Props {
  count: number;
  status: ProductStatusFilter;
  busy?: boolean;
  onClear: () => void;
  onAction: (a: BulkAction) => void;
}

/** Barre flottante d'actions groupées (apparaît dès qu'une ligne est cochée). */
export function BulkBar({ count, status, busy, onClear, onAction }: Props) {
  const [dialog, setDialog] = useState<"category" | "discount" | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [percent, setPercent] = useState("10");
  const { data: categories } = useAdminCategories(dialog === "category");
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50";

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="sticky bottom-3 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-2 rounded-[20px] bg-ink-dark p-2.5 pl-4 shadow-[0_12px_40px_rgba(0,0,0,.35)]"
          >
            <span className="mr-1 text-[13px] font-bold text-white">{count} sélectionné{count > 1 ? "s" : ""}</span>
            {status === "trash" ? (
              <button className={btn} disabled={busy} onClick={() => onAction({ type: "restore" })}><Refresh2 size={15} /> Restaurer</button>
            ) : (
              <>
                <button className={btn} disabled={busy} onClick={() => onAction({ type: "activate" })}><Eye size={15} /> Activer</button>
                <button className={btn} disabled={busy} onClick={() => onAction({ type: "deactivate" })}><EyeSlash size={15} /> Désactiver</button>
                <button className={btn} disabled={busy} onClick={() => setDialog("category")}><Category2 size={15} /> Catégorie</button>
                <button className={btn} disabled={busy} onClick={() => setDialog("discount")}><Tag size={15} /> Remise</button>
                <button className={`${btn} !bg-danger/80 hover:!bg-danger`} disabled={busy} onClick={() => onAction({ type: "trash" })}><Trash size={15} /> Corbeille</button>
              </>
            )}
            <button aria-label="Tout désélectionner" onClick={onClear} className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white"><CloseCircle size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={dialog === "category"} onClose={() => setDialog(null)} title="Changer de catégorie" className="max-w-[440px]">
        <div className="grid gap-4">
          <Select label={`Nouvelle catégorie pour ${count} produit${count > 1 ? "s" : ""}`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={[{ value: "", label: "Choisir…" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="chip" upper={false} onClick={() => setDialog(null)}>Annuler</Button>
            <Button upper={false} disabled={!categoryId} onClick={() => { onAction({ type: "category", categoryId: Number(categoryId) }); setDialog(null); }}>Appliquer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={dialog === "discount"} onClose={() => setDialog(null)} title="Appliquer une remise" className="max-w-[440px]">
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-[13px] font-semibold">
            Remise (%) sur {count} produit{count > 1 ? "s" : ""}
            <input type="number" min={0} max={90} value={percent} onChange={(e) => setPercent(e.target.value)} className="field" />
            <span className="text-[12px] font-normal text-ink-3">Le prix soldé = prix normal − remise. Saisissez 0 pour retirer la promotion.</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="chip" upper={false} onClick={() => setDialog(null)}>Annuler</Button>
            <Button upper={false} disabled={percent === "" || Number(percent) < 0 || Number(percent) > 90} onClick={() => { onAction({ type: "discount", percent: Number(percent) }); setDialog(null); }}>Appliquer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
