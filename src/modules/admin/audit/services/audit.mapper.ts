import type { AuditEntry } from "../types";

/** Entrée du journal de modifications (après camelCase ; `changes` garde les noms de champs de l'API). */
export interface ChangeDto {
  id: number;
  timestamp: string;
  action: "create" | "update" | "delete" | "access";
  objectType: string;
  objectId: string;
  objectRepr: string;
  changes: Record<string, [unknown, unknown]> | null;
  actor: { id: number; name: string } | null;
}

export interface ObjectTypeDto {
  key: string;
  label: string;
}

const ACTION_LABEL: Record<ChangeDto["action"], string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  access: "Consultation",
};

const SYSTEM = { id: 0, name: "Système" };

const scalar = (v: unknown): string | number | null => (v == null ? null : typeof v === "number" || typeof v === "string" ? v : JSON.stringify(v));

export function toAuditEntry(dto: ChangeDto, labels: Map<string, string>): AuditEntry {
  const label = labels.get(dto.objectType) ?? dto.objectType;
  return {
    id: dto.id,
    at: dto.timestamp,
    actor: dto.actor ?? SYSTEM,
    action: ACTION_LABEL[dto.action] ?? dto.action,
    entity: dto.objectType,
    entityLabel: label,
    entityId: dto.objectId || null,
    summary: `${ACTION_LABEL[dto.action] ?? dto.action} : ${label} « ${dto.objectRepr} »`,
    diff: Object.entries(dto.changes ?? {}).map(([field, [from, to]]) => ({ field, from: scalar(from), to: scalar(to) })),
  };
}
