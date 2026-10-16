"use client";

import { useState } from "react";
import { Add, Edit2, TicketStar, Trash } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { SettingsSection } from "../../settings/components/SettingsForm";
import { TRIGGER_LABELS, useDeleteRule, useLoyaltyRules, usePatchRule, type LoyaltyRule } from "../rules";
import { RuleFormModal } from "./RuleFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white sm:size-9";

/** Condition résumée pour la liste (montant, produit, catégorie, photo, inactivité). */
function conditionLabel(rule: LoyaltyRule): string | null {
  const c = rule.condition;
  const parts: string[] = [];
  if (c.minAmount != null) parts.push(`dès ${formatPrice(c.minAmount)}`);
  if (c.productId != null) parts.push(`produit n°${c.productId}`);
  if (c.categoryId != null) parts.push(`catégorie n°${c.categoryId}`);
  if (c.photoRequired) parts.push("avec photo");
  if (c.daysInactive != null) parts.push(`après ${c.daysInactive} j d'inactivité`);
  return parts.length ? parts.join(" · ") : null;
}

/** Limites résumées pour la liste (par client, par jour, délai). */
function limitsLabel(rule: LoyaltyRule): string {
  const parts: string[] = [];
  if (rule.maxPerUser != null) parts.push(`${rule.maxPerUser} max./client`);
  if (rule.maxPerDay != null) parts.push(`${rule.maxPerDay} max./jour`);
  if (rule.cooldownDays != null) parts.push(`toutes les ${rule.cooldownDays} j`);
  return parts.length ? parts.join(" · ") : "Sans limite";
}

function RuleRow({ rule, onEdit, onDelete }: { rule: LoyaltyRule; onEdit: () => void; onDelete: () => void }) {
  const patch = usePatchRule();
  const condition = conditionLabel(rule);

  return (
    <li className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", !rule.isActive && "bg-chip/50")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold leading-[19px]">{rule.name}</span>
          {!rule.isActive && <span className="rounded-full bg-line-3 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Inactive</span>}
        </p>
        <p className="text-[13px] text-ink-2">
          {TRIGGER_LABELS[rule.trigger]}
          {condition && <span className="text-ink-3"> · {condition}</span>}
        </p>
        <p className="text-[12px] text-ink-3">{limitsLabel(rule)}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="whitespace-nowrap rounded-full bg-primary-100 px-3 py-1 text-[14px] font-bold text-primary">+{rule.pointsValue} pts</span>
        <span className="mx-1 hidden h-7 w-px bg-line-3 sm:block" aria-hidden />
        <Switch
          label={`Règle ${rule.name} active`}
          checked={rule.isActive}
          onChange={(x) =>
            patch.mutate(
              { id: rule.id, isActive: x },
              { onSuccess: () => toast.success(x ? "Règle activée" : "Règle désactivée", rule.name), onError: (e) => toast.error("Changement impossible", getErrorMessage(e)) },
            )
          }
        />
        <button type="button" aria-label={`Modifier la règle ${rule.name}`} onClick={onEdit} className={iconBtn}><Edit2 size={16} /></button>
        <button type="button" aria-label={`Supprimer la règle ${rule.name}`} onClick={onDelete} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
      </div>
    </li>
  );
}

/** Points fidélité : les règles TCA qui créditent des points, gérées par l'admin (bo/loyalty/rules/). */
export function RulesSection() {
  const { data, isLoading, isError, error, refetch } = useLoyaltyRules();
  const [editing, setEditing] = useState<LoyaltyRule | "new" | null>(null);
  const [toDelete, setToDelete] = useState<LoyaltyRule | null>(null);
  const del = useDeleteRule();
  const rules = data ?? [];

  return (
    <SettingsSection
      title="Points fidélité"
      hint="Chaque règle crédite des points au client dès qu'elle se déclenche. Les points déjà gagnés restent acquis même après désactivation."
      aside={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouvelle règle</Button>}
    >
      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des règles…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[92px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les règles de points.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<TicketStar size={44} variant="Bulk" />}
          title="Aucune règle de points"
          description="Ajoutez une règle (inscription, premier achat, avis…) pour créditer automatiquement des points fidélité."
          action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Créer une règle</Button>}
        />
      ) : (
        <ol className="grid gap-2.5">
          {rules.map((r) => (
            <RuleRow key={r.id} rule={r} onEdit={() => setEditing(r)} onDelete={() => setToDelete(r)} />
          ))}
        </ol>
      )}

      {editing && <RuleFormModal key={editing === "new" ? "new" : editing.id} rule={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Règle supprimée", toDelete.name);
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer cette règle ?"
        message="Elle ne créditera plus de points. Les points déjà gagnés par les clients restent acquis."
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </SettingsSection>
  );
}
