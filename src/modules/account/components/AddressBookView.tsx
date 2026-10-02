"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add, Briefcase, Call, Edit2, Home2, Location, Trash, User, Star1 } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { displayName } from "@/modules/auth/types";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "../hooks/useAddressBook";
import type { SavedAddress } from "../types";
import { AddressFormModal } from "./AddressFormModal";

export function addressIcon(label: string) {
  return label === "Bureau" ? Briefcase : label === "Domicile" ? Home2 : Location;
}

function Content() {
  const { user } = useAuth();
  const { data, isLoading } = useAddresses();
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SavedAddress | null>(null);

  const open = (a: SavedAddress | null) => {
    setEditing(a);
    setFormOpen(true);
  };

  return (
    <Block>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h-page text-primary">Mes adresses</h1>
          <p className="mt-1 text-[14px] text-ink-2">Enregistrez plusieurs adresses et choisissez-en une à chaque commande.</p>
        </div>
        <Button onClick={() => open(null)} leftIcon={<Add size={16} />}>Ajouter une adresse</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[170px] !rounded-box" />
            <Skeleton className="h-[170px] !rounded-box" />
          </>
        ) : data && data.length > 0 ? (
          <AnimatePresence initial={false}>
            {data.map((a) => {
              const Icon = addressIcon(a.label);
              return (
                <motion.article
                  layout
                  key={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn("relative rounded-box border-2 p-5 transition-colors", a.isDefault ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/40")}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", a.isDefault ? "bg-primary text-white" : "bg-chip")}><Icon size={20} variant="Bold" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold">
                        {a.label}
                        {a.isDefault && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">Par défaut</span>}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-2"><User size={14} /> {a.recipient}</p>
                      <p className="mt-1 flex items-center gap-2 text-[13px] text-ink-2"><Call size={14} /> {a.phone}</p>
                      <p className="mt-1 flex items-start gap-2 text-[13px] leading-[19px] text-ink-2"><Location size={14} className="mt-0.5 shrink-0" /> {a.line1}, {a.quarter}, {a.city}, {a.country}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!a.isDefault && (
                      <Button size="xs" variant="outline" upper={false} loading={setDefault.isPending && setDefault.variables === a.id} leftIcon={<Star1 size={13} />} onClick={() => setDefault.mutate(a.id, { onSuccess: () => toast.success("Adresse par défaut mise à jour") })}>
                        Définir par défaut
                      </Button>
                    )}
                    <Button size="xs" variant="chip" upper={false} leftIcon={<Edit2 size={13} />} onClick={() => open(a)}>Modifier</Button>
                    <Button size="xs" variant="ghost" upper={false} className="text-danger hover:!bg-danger-100" leftIcon={<Trash size={13} />} onClick={() => setToDelete(a)}>Supprimer</Button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="md:col-span-2">
            <EmptyState icon={<Location size={44} variant="Bulk" />} title="Aucune adresse enregistrée" description="Ajoutez votre première adresse pour commander plus vite." action={<Button onClick={() => open(null)}>Ajouter une adresse</Button>} />
          </div>
        )}
      </div>

      <AddressFormModal open={formOpen} onClose={() => setFormOpen(false)} address={editing} defaults={{ recipient: user ? displayName(user) : "", phone: user?.phoneNumber ?? "" }} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Supprimer cette adresse ?"
        message={toDelete ? `« ${toDelete.label} » — ${toDelete.line1}, ${toDelete.quarter} sera retirée de votre carnet.` : ""}
        confirmLabel="Supprimer"
        loading={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => { toast.success("Adresse supprimée"); setToDelete(null); } })}
      />
    </Block>
  );
}

export function AddressBookView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Adresses" }]} />
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
