"use client";

import { AnimatePresence, motion } from "motion/react";
import { Notification as BellIcon, TickSquare } from "iconsax-reactjs";
import { useState } from "react";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useMarkAllRead, useNotifications, useResellerOptions } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

const PAGE_SIZE = 6;

function Inner({ embedded }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page, PAGE_SIZE);
  const canAssign = user?.role === "mukubwa" || user?.role === "admin";
  const { data: resellers = [] } = useResellerOptions(canAssign);
  const markAll = useMarkAllRead();

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const unread = Number(data?.meta?.unread ?? 0);
  const pageCount = Math.max(1, data?.totalPages ?? 1);
  const readAll = () => markAll.mutate(undefined);

  return (
    <>
      {!embedded && (
        <div className="hidden lg:block">
          <Breadcrumb items={[{ label: "Notifications" }]} />
        </div>
      )}
      <Block pad="none" className="p-4 pb-24 sm:p-[30px] lg:pb-[30px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-[22px] leading-[28px] sm:text-h-page">Notifications</h1>
            <p className="mt-1 text-[13px] text-ink-2 sm:text-[14px]">{unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour"} · {total} au total</p>
          </div>
          {unread > 0 && (
            <Button className="hidden lg:inline-flex" variant="chip" size="sm" upper={false} leftIcon={<TickSquare size={16} />} loading={markAll.isPending} onClick={readAll}>
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-box" />)}</div>
        ) : total === 0 ? (
          <EmptyState icon={<BellIcon size={40} variant="Bulk" />} title="Aucune notification" description={user?.role === "client" ? "Le suivi de vos commandes et les réponses de nos revendeurs apparaîtront ici." : "Les nouvelles commandes et messages apparaîtront ici."} />
        ) : (
          <>
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((n) => (
                  <NotificationItem key={n.id} notification={n} role={user?.role ?? "client"} resellers={resellers} />
                ))}
              </AnimatePresence>
            </ul>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} className="mt-6 sm:mt-8" />
          </>
        )}
      </Block>

      {/* Mobile : action collante au-dessus de la barre d'onglets */}
      <AnimatePresence>
        {unread > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-4 bottom-[calc(var(--tabbar-h)+12px)] z-40 lg:hidden"
          >
            <Button fullWidth upper={false} size="md" leftIcon={<TickSquare size={18} variant="Bold" />} loading={markAll.isPending} onClick={readAll} className="shadow-[0_10px_28px_rgba(26,186,26,.4)]">
              Tout marquer comme lu ({unread})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** `embedded` : rendu dans le back-office (sans fil d'Ariane). Chacun ne voit que ses propres notifications. */
export function NotificationsView({ embedded }: { embedded?: boolean }) {
  return (
    <AuthGuard>
      <Inner embedded={embedded} />
    </AuthGuard>
  );
}
