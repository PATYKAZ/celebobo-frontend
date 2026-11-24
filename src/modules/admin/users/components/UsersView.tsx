"use client";

import { SearchNormal1, TickCircle } from "@/shared/ui/icons";
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
import { useOnline, useSaveUser, useSendPasswordReset, useSetUserActive, useSetUserRole, useUsers } from "../hooks/useUsers";
import { ROLES, ROLE_DESCRIPTION, type UserFormValues, type UserRow } from "../types";

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
            <span><span className="block text-sm font-bold">{ROLE_LABEL[r]}</span><span className="text-xs text-ink-2">{ROLE_DESCRIPTION[r]}</span></span>
          </button>
        ))}
      </div>
      {current === "revendeur" && user?.role !== "revendeur" && <p className="mt-3 rounded-box bg-chip p-3 text-xs text-ink-2">Un code d&apos;invitation à 4 chiffres sera attribué ; ses commissions suivent les règles communes à tous les revendeurs.</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} loading={setRoleMut.isPending} onClick={save} disabled={!user || current === user.role}>Enregistrer</Button>
      </div>
    </Modal>
  );
}

const EMPTY: UserFormValues = { firstName: "", lastName: "", email: "", phone: "", role: "mukubwa" };

/** Nouveau compte (invitation par e-mail) ou modification des coordonnées. */
function UserFormModal({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const [v, setV] = useState<UserFormValues>(() => (user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "", role: user.role } : EMPTY));
  const save = useSaveUser();
  const reset = useSendPasswordReset();
  const set = <K extends keyof UserFormValues>(k: K, value: UserFormValues[K]) => setV((s) => ({ ...s, [k]: value }));
  const submit = () =>
    save.mutate(
      { id: user?.id ?? null, values: v },
      {
        onSuccess: () => {
          toast.success(user ? "Compte modifié" : "Compte créé", user ? v.email : `${v.email} reçoit une invitation pour choisir son mot de passe.`);
          onClose();
        },
        onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
      },
    );
  return (
    <>
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Prénom" value={v.firstName} onChange={(e) => set("firstName", e.target.value)} />
          <Input label="Nom" value={v.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <Input label="E-mail" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Téléphone" type="tel" placeholder="+243 …" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        {!user && <Select label="Rôle" value={v.role} onChange={(e) => set("role", e.target.value as UserRole)} options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />}
        {!user && <p className="text-xs text-ink-3">Le compte reçoit un e-mail d&apos;invitation pour choisir son mot de passe.</p>}
        {user && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-box bg-chip p-3 text-xs text-ink-2">
            <span>Mot de passe oublié ? Envoyez-lui un lien pour en choisir un nouveau.</span>
            <Button
              size="xs"
              variant="secondary"
              upper={false}
              loading={reset.isPending}
              onClick={() => reset.mutate(user.id, { onSuccess: () => toast.success("Lien envoyé", `${user.email} reçoit un lien pour choisir un nouveau mot de passe.`), onError: (e) => toast.error("Envoi impossible", getErrorMessage(e)) })}
            >
              Envoyer le lien
            </Button>
          </div>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} loading={save.isPending} disabled={!v.firstName.trim() || !v.email.trim()} onClick={submit}>{user ? "Enregistrer" : "Créer le compte"}</Button>
      </div>
    </>
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
  const [formFor, setFormFor] = useState<UserRow | null | "new">(null);
  const online = useOnline((data?.results ?? []).map((u) => u.id)).data;

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
            <p className="truncate font-semibold">
              {u.name}
              {u.id === me?.id && <span className="ml-1.5 text-xs font-bold text-primary">(vous)</span>}
              {online?.has(u.id) && <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary"><span className="size-2 rounded-full bg-primary" aria-hidden />en ligne</span>}
            </p>
            <p className="truncate text-xs text-ink-3">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rôle", cell: (u) => <StatusDot tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</StatusDot> },
    { key: "phone", header: "Téléphone", hideBelow: "lg", cell: (u) => <span className="text-ink-2">{u.phone ?? "—"}</span> },
    { key: "inv", header: "Invité par", hideBelow: "2xl", mobile: "hide", cell: (u) => <span className="text-ink-2">{u.invitedBy?.name ?? "—"}</span> },
    { key: "code", header: "Code", hideBelow: "2xl", mobile: "hide", cell: (u) => (u.codeRevendeur ? <strong className="tracking-widest">{u.codeRevendeur}</strong> : <span className="text-ink-3">—</span>) },
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
            <Button size="xs" variant="secondary" upper={false} className="max-md:min-h-11 max-md:px-5" onClick={() => setFormFor(u)}>Modifier</Button>
            <Button size="xs" variant="secondary" upper={false} className="max-md:min-h-11 max-md:px-5" disabled={self} onClick={() => setRoleFor(u)} title={self ? "Vous ne pouvez pas modifier votre propre rôle" : undefined}>Rôle</Button>
            <Button size="xs" variant={u.active ? "ghost" : "secondary"} upper={false} className={cn("max-md:min-h-11 max-md:px-5", u.active && "text-danger hover:bg-danger-50")} disabled={self} onClick={() => setToggleFor(u)}>{u.active ? "Désactiver" : "Activer"}</Button>
          </div>
        );
      },
    },
  ];

  const tabs = (["all", ...ROLES] as const).map((r) => ({ value: r, label: r === "all" ? "Tous" : ROLE_LABEL[r], count: data?.counts[r] }));

  return (
    <>
      <PageHeader title="Utilisateurs & rôles" description="Gérez les comptes, les rôles (client, revendeur, responsable, administrateur) et l'accès au back-office." actions={<Button upper={false} onClick={() => setFormFor("new")}>Nouveau compte</Button>} />
      <Block pad="none">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-5 sm:px-8">
          <Tabs variant="pill" tabs={tabs} value={role} onChange={(r) => { setRole(r); setPage(1); }} />
          <Input wrapperClassName="sm:min-w-[220px] sm:flex-1" placeholder="Rechercher un nom, e-mail, téléphone, code…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select wrapperClassName="sm:w-[170px]" aria-label="Statut" value={active} onChange={(e) => { setActive(e.target.value as typeof active); setPage(1); }} options={[{ value: "all", label: "Tous statuts" }, { value: "actif", label: "Actifs" }, { value: "inactif", label: "Désactivés" }]} />
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
          empty={<p className="py-14 text-center text-sm text-ink-3">Aucun utilisateur ne correspond à votre recherche.</p>}
        />
      </Block>
      <RoleModal user={roleFor} onClose={() => setRoleFor(null)} />
      <Modal open={formFor !== null} onClose={() => setFormFor(null)} title={formFor === "new" ? "Nouveau compte" : formFor ? `Modifier ${formFor.name}` : "Compte"}>
        {formFor !== null && <UserFormModal key={formFor === "new" ? "new" : formFor.id} user={formFor === "new" ? null : formFor} onClose={() => setFormFor(null)} />}
      </Modal>
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
