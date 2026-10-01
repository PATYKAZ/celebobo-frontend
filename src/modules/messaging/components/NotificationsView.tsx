"use client";

import { AnimatePresence } from "motion/react";
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

function Inner() {
  const { user } = useAuth();
  const { data, isLoading } = useNotifications();
  const canAssign = user?.role === "mukubwa" || user?.role === "admin";
  const { data: resellers = [] } = useResellerOptions(canAssign);
  const markAll = useMarkAllRead();
  const [page, setPage] = useState(1);

  const all = data ?? [];
  const unread = all.filter((n) => !n.isRead);
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Breadcrumb items={[{ label: "Notifications" }]} />
      <Block>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-h-page">Notifications</h1>
            <p className="mt-1 text-[14px] text-ink-2">{unread.length > 0 ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}` : "Vous êtes à jour"} · {all.length} au total</p>
          </div>
          {unread.length > 0 && (
            <Button variant="chip" size="sm" upper={false} leftIcon={<TickSquare size={16} />} loading={markAll.isPending} onClick={() => markAll.mutate(unread.map((n) => n.id))}>
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-box" />)}</div>
        ) : all.length === 0 ? (
          <EmptyState icon={<BellIcon size={40} variant="Bulk" />} title="Aucune notification" description="Les nouvelles commandes et messages apparaîtront ici." />
        ) : (
          <>
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((n) => (
                  <NotificationItem key={n.id} notification={n} role={user?.role ?? "client"} resellers={resellers} />
                ))}
              </AnimatePresence>
            </ul>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} className="mt-8" />
          </>
        )}
      </Block>
    </>
  );
}

export function NotificationsView() {
  return (
    <AuthGuard roles={["revendeur", "mukubwa", "admin"]}>
      <Inner />
    </AuthGuard>
  );
}
