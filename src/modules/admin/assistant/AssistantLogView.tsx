"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MessageQuestion } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Select } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { api, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

type Sentiment = "positive" | "neutral" | "negative";

interface QuestionLog {
  id: number;
  sessionId: string;
  userId: number | null;
  question: string;
  answer: string;
  sentiment: Sentiment | "";
  topic: string;
  productsCount: number;
  inputTokens: number;
  outputTokens: number;
  cost: string;
  latencyMs: number;
  errorCode: string;
  createdAt: string;
}

const SENTIMENT: Record<Sentiment, { label: string; tone: "green" | "gray" | "red" }> = {
  positive: { label: "Positif", tone: "green" },
  neutral: { label: "Neutre", tone: "gray" },
  negative: { label: "Négatif", tone: "red" },
};

function Row({ log }: { log: QuestionLog }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="px-4 py-3 text-[13px] sm:px-6">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="block w-full text-left">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <b className="min-w-0 text-[14px]">{log.question}</b>
          <span className="flex shrink-0 items-center gap-1.5">
            {log.errorCode && <Pill tone="red">{log.errorCode}</Pill>}
            {log.sentiment && <Pill tone={SENTIMENT[log.sentiment].tone}>{SENTIMENT[log.sentiment].label}</Pill>}
          </span>
        </span>
        <span className="mt-0.5 block text-ink-3">
          {formatDateTime(log.createdAt)}
          {log.topic ? ` · ${log.topic}` : ""}
          {log.productsCount ? ` · ${log.productsCount} produit(s) proposé(s)` : ""}
          {` · ${(log.latencyMs / 1000).toFixed(1)} s · ${log.inputTokens + log.outputTokens} jetons · ${Number(log.cost).toLocaleString("fr-FR", { maximumFractionDigits: 4 })} $`}
          {log.userId ? "" : " · visiteur"}
        </span>
      </button>
      {open && log.answer && <p className="mt-2 whitespace-pre-line rounded-box bg-page/60 p-3 text-ink-2">{log.answer}</p>}
    </li>
  );
}

function Reindex() {
  const reindex = useMutation({
    mutationFn: () => api.post(ENDPOINTS.admin.assistant.reindex),
    onSuccess: () => toast.success("Réindexation lancée", "L'index des produits se reconstruit en arrière-plan (quelques minutes)."),
    onError: (e) => toast.error("Réindexation impossible", getErrorMessage(e)),
  });
  return <Button variant="outline" upper={false} loading={reindex.isPending} onClick={() => reindex.mutate()}>Reconstruire l&apos;index</Button>;
}

function Content() {
  const canReindex = useCan("embeddings.reindex");
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [topic, setTopic] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 300);
  const t = useDebounce(topic.trim(), 300);
  const { data, isLoading } = useAdminPage<QuestionLog>("assistant-logs", ENDPOINTS.admin.assistant.logs, { search: q, sentiment, topic: t, dateFrom: from, dateTo: to }, page);
  const at = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  return (
    <>
      <PageHeader
        title="Assistant"
        description="Les questions posées à l'assistant de la boutique : sujet, ressenti, produits proposés, durée et coût. Reconstruisez l'index après un changement de modèle ou un gros import."
        actions={canReindex ? <Reindex /> : undefined}
      />
      <Block pad="none" className="overflow-hidden">
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 sm:px-[30px] xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr]">
          <Input aria-label="Rechercher" placeholder="Texte de la question…" value={search} onChange={(e) => at(setSearch)(e.target.value)} />
          <Select aria-label="Ressenti" value={sentiment} onChange={(e) => at(setSentiment)(e.target.value)} options={[{ value: "", label: "Tous les ressentis" }, ...Object.entries(SENTIMENT).map(([value, s]) => ({ value, label: s.label }))]} />
          <Input aria-label="Sujet" placeholder="Sujet (ex. livraison)" value={topic} onChange={(e) => at(setTopic)(e.target.value)} />
          <Input type="date" aria-label="Du" value={from} onChange={(e) => at(setFrom)(e.target.value)} />
          <Input type="date" aria-label="Au" value={to} onChange={(e) => at(setTo)(e.target.value)} />
        </div>
        {data && <p className="px-4 text-[13px] text-ink-3 sm:px-[30px]">{data.meta.count} question{data.meta.count > 1 ? "s" : ""}</p>}
        {isLoading || !data ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : data.results.length === 0 ? (
          <EmptyState icon={<MessageQuestion size={40} />} title="Aucune question" description="Rien ne correspond à ces filtres." />
        ) : (
          <ul className="divide-y divide-line-3">{data.results.map((log) => <Row key={log.id} log={log} />)}</ul>
        )}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function AssistantLogView() {
  return (
    <PermissionGuard permission="assistant.logs">
      <Content />
    </PermissionGuard>
  );
}
