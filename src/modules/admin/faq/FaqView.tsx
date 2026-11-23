"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageText1 } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Switch, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage } from "@/shared/lib/api";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";

interface FaqEntry {
  id: number;
  question: string;
  answer: string;
  category: string;
  position: number;
  isPublished: boolean;
}

type Values = Omit<FaqEntry, "id">;

const KEY = ["admin", "faq"] as const;
const EMPTY: Values = { question: "", answer: "", category: "", position: 0, isPublished: true };

function EntryForm({ entry, categories, onClose }: { entry: FaqEntry | null; categories: string[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<Values>(entry ?? EMPTY);
  const set = <K extends keyof Values>(k: K, value: Values[K]) => setV((s) => ({ ...s, [k]: value }));
  const save = useMutation({
    mutationFn: () => (entry ? api.patch<FaqEntry>(ENDPOINTS.admin.faq.detail(entry.id), v) : api.post<FaqEntry>(ENDPOINTS.admin.faq.list, v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(entry ? "Question modifiée" : "Question ajoutée");
      onClose();
    },
    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
  });
  return (
    <div className="space-y-3">
      <Input label="Question" value={v.question} onChange={(e) => set("question", e.target.value)} />
      <Textarea label="Réponse" value={v.answer} onChange={(e) => set("answer", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Input label="Rubrique" list="faq-categories" value={v.category} onChange={(e) => set("category", e.target.value)} hint="Les questions sont groupées par rubrique" />
        <Input label="Ordre" type="number" min="0" value={String(v.position)} onChange={(e) => set("position", Number(e.target.value) || 0)} />
      </div>
      <datalist id="faq-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      <Switch checked={v.isPublished} onChange={(on) => set("isPublished", on)} label="Visible sur le site" />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} disabled={!v.question.trim() || !v.answer.trim()} loading={save.isPending} onClick={() => save.mutate()}>Enregistrer</Button>
      </div>
    </div>
  );
}

function Content() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FaqEntry | null | "new">(null);
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<FaqEntry[]>(ENDPOINTS.admin.faq.list) });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(ENDPOINTS.admin.faq.detail(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Question supprimée"); },
    onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
  });
  const groups = useMemo(() => {
    const map = new Map<string, FaqEntry[]>();
    for (const entry of data ?? []) map.set(entry.category || "Général", [...(map.get(entry.category || "Général") ?? []), entry]);
    return [...map.entries()];
  }, [data]);
  return (
    <>
      <PageHeader title="FAQ" description="Les questions fréquentes affichées sur le site, par rubrique." actions={<Button upper={false} onClick={() => setEditing("new")}>Nouvelle question</Button>} />
      {isLoading || !data ? (
        <Skeleton className="h-60 rounded-box!" />
      ) : data.length === 0 ? (
        <Block><EmptyState icon={<MessageText1 size={40} />} title="Aucune question" description="Ajoutez les questions que vos clients posent le plus souvent." /></Block>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groups.map(([category, entries]) => (
            <Block key={category} pad="none" className="overflow-hidden">
              <h2 className="px-4 pt-4 text-sm font-bold sm:px-6">{category}</h2>
              <ul className="divide-y divide-line-3">
                {entries.map((entry) => (
                  <li key={entry.id} className="space-y-1 px-4 py-3 text-sm sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <b className="text-sm">{entry.question}</b>
                      {!entry.isPublished && <Pill tone="gray">Masquée</Pill>}
                    </div>
                    <p className="line-clamp-2 whitespace-pre-line text-ink-2">{entry.answer}</p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="secondary" upper={false} onClick={() => setEditing(entry)}>Modifier</Button>
                      <Button size="sm" variant="ghost" upper={false} loading={remove.isPending && remove.variables === entry.id} onClick={() => remove.mutate(entry.id)}>Supprimer</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Block>
          ))}
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nouvelle question" : "Modifier la question"} className="max-w-[600px]">
        {editing !== null && <EntryForm entry={editing === "new" ? null : editing} categories={[...new Set((data ?? []).map((e) => e.category).filter(Boolean))]} onClose={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

export function FaqView() {
  return (
    <PermissionGuard permission="content.manage">
      <Content />
    </PermissionGuard>
  );
}
