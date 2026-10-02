"use client";

import { SearchNormal1, TickCircle } from "iconsax-reactjs";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { ROLE_LABEL } from "@/modules/auth/permissions";
import type { UserRole } from "@/modules/auth/types";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { useSetUserActive, useSetUserRole, useUsers } from "../hooks/useUsers";
import { ROLES, ROLE_DESCRIPTION, type UserRow } from "../types";

const PAGE_SIZE = 10;
const ROLE_TONE: Record<UserRole, "gray" | "green" | "blue" | "orange"> = { client: "gray", revendeur: "green", mukubwa: "blue", admin: "orange" };

export function UsersView() {
  return (
    <PermissionGuard permission="users.manage">
      <UsersContent />
    </PermissionGuard>
  );
}

function RoleModal({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const setRoleMut = useSetUserRole();
  const current = role ?? user?.role ?? "client";

  const save = () => {
    if (!user || current === user.role) return onClose();
    setRoleMut.mutate(
      { id: user.id, role: current },
      {
        onSuccess: () => {
          toast.success("Rôle modifié", `${user.name} → ${ROLE_LABEL[current]}`);
          setRole(null);
          onClose();
        },
        onError: (e) => toast.error("Modification impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <Modal open={!!user} onClose={() => { setRole(null); onClose(); }} title={user ? `Rôle de ${user.name}` : "Rôle"}>
      <div className="grid gap-2.5">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn("flex items-start gap-3 rounded-box border p-3.5 text-left transition-colors", current === r ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/60")}
            aria-pressed={current === r}
          >
            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", current === r ? "border-primary bg-primary text-white" : "border-line")}>{current === r && <TickCircle size={14} variant="Bold" />}</span>
            <span><span className="block text-[14px] font-bold leading-[20px]">{ROLE_LABEL[r]}</span><span className="text-[12px] leading-[18px] text-ink-2">{ROLE_DESCRIPTION[r]}</span></span>
          </button>
        ))}
      </div>
      {current === "revendeur" && user?.role !== "revendeur" && <p className="mt-3 rounded-box bg-chip p-3 text-[12px] leading-[18px] text-ink-2">Un code d&apos;invitation à 4 chiffres et un taux de commission par défaut (7 %) seront attribués.</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} loading={setRoleMut.isPending} onClick={save} disabled={!user || current === user.role}>Enregistrer</Button>
      </div>
    </Modal>
  );
}

function UsersContent() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [active, setActive] = useState<"all" | "actif" | "inactif">("all");
  const [page, setPage] = useState(1);
  const [roleFor, setRoleFor] = useState<UserRow | null>(null);
  const [toggleFor, setToggleFor] = useState<UserRow | null>(null);
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useUsers({ search: debounced, role, active, page, pageSize: PAGE_SIZE });
  const setActiveMut = useSetUserActive();

  const confirmToggle = () => {
    if (!toggleFor) return;
    setActiveMut.mutate(
      { id: toggleFor.id, active: !toggleFor.active },
      {
        onSuccess: () => {
          toast.success(toggleFor.active ? "Compte désactivé" : "Compte activé", toggleFor.name);
          setToggleFor(null);
        },
        onError: (e) => toast.error("Action impossible", getErrorMessage(e)),
      },
    );
  };

  const columns: Column<UserRow>[] = [
    {
      key: "u",
      header: "Utilisateur",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size={38} />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-[18px]">{u.name}{u.id === me?.id && <span className="ml-1.5 text-[11px] font-bold text-primary">(vous)</span>}</p>
            <p className="truncate text-[12px] text-ink-3">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rôle", cell: (u) => <StatusDot tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</StatusDot> },
    { key: "phone", header: "Téléphone", hideBelow: "lg", cell: (u) => <span className="text-ink-2">{u.phone ?? "—"}</span> },
    { key: "inv", header: "Invité par", hideBelow: "lg", cell: (u) => <span className="text-ink-2">{u.invitedBy?.name ?? "—"}</span> },
    { key: "code", header: "Code", hideBelow: "xl", cell: (u) => (u.codeRevendeur ? <strong className="tracking-widest">{u.codeRevendeur}</strong> : <span className="text-ink-3">—</span>) },
    { key: "joined", header: "Inscrit le", hideBelow: "md", cell: (u) => <span className="text-ink-2">{formatDate(u.joinedAt)}</span> },
    { key: "st", header: "Statut", hideBelow: "sm", cell: (u) => <StatusDot tone={u.active ? "green" : "gray"}>{u.active ? "Actif" : "Désactivé"}</StatusDot> },
    {
      key: "act",
      header: "",
      align: "right",
      cell: (u) => {
        const self = u.id === me?.id;
        return (
          <div className="flex justify-end gap-2">
            <Button size="xs" variant="chip" upper={false} disabled={self} onClick={() => setRoleFor(u)} title={self ? "Vous ne pouvez pas modifier votre propre rôle" : undefined}>Rôle</Button>
            <Button size="xs" variant={u.active ? "ghost" : "outline"} upper={false} disabled={self} onClick={() => setToggleFor(u)}>{u.active ? "Désactiver" : "Activer"}</Button>
          </div>
        );
      },
    },
  ];

  const tabs = (["all", ...ROLES] as const).map((r) => ({ value: r, label: r === "all" ? "Tous" : ROLE_LABEL[r], count: data?.counts[r] }));

  return (
    <>
      <PageHeader title="Utilisateurs & rôles" description="Gérez les comptes, les rôles (client, revendeur, responsable, administrateur) et l'accès au back-office." />
      <Block pad="none">
        <div className="flex flex-wrap items-end gap-4 p-5 sm:px-[30px]">
          <Tabs variant="pill" tabs={tabs} value={role} onChange={(r) => { setRole(r); setPage(1); }} />
          <Input wrapperClassName="min-w-[220px] flex-1" placeholder="Rechercher un nom, e-mail, téléphone, code…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select wrapperClassName="w-[170px]" aria-label="Statut" value={active} onChange={(e) => { setActive(e.target.value as typeof active); setPage(1); }} options={[{ value: "all", label: "Tous statuts" }, { value: "actif", label: "Actifs" }, { value: "inactif", label: "Désactivés" }]} />
        </div>
        <DataTable
          columns={columns}
          rows={data?.results}
          loading={isLoading}
          rowKey={(u) => u.id}
          page={page}
          pageCount={data ? Math.ceil(data.count / PAGE_SIZE) : 1}
          onPageChange={setPage}
          skeletonRows={PAGE_SIZE}
          empty={<p className="py-14 text-center text-[14px] text-ink-3">Aucun utilisateur ne correspond à votre recherche.</p>}
        />
      </Block>
      <RoleModal user={roleFor} onClose={() => setRoleFor(null)} />
      <ConfirmDialog
        open={!!toggleFor}
        onClose={() => setToggleFor(null)}
        onConfirm={confirmToggle}
        loading={setActiveMut.isPending}
        tone={toggleFor?.active ? "danger" : "primary"}
        title={toggleFor?.active ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
        message={toggleFor?.active ? `${toggleFor?.name} ne pourra plus se connecter ni recevoir de commandes.` : `${toggleFor?.name} retrouvera l'accès à son compte.`}
        confirmLabel={toggleFor?.active ? "Désactiver" : "Activer"}
      />
    </>
  );
}
