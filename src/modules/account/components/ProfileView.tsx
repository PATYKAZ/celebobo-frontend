"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Tabs } from "@/shared/ui/Tabs";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PointsCard } from "@/modules/points/components/PointsCard";
import { useProfile } from "../hooks/useAccount";
import { AccountNav } from "./AccountShell";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { SecuritySettings } from "./SecuritySettings";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";

type Tab = "info" | "security";

function Content() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [tab, setTab] = useState<Tab>("info");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!user) return null;
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Reveal direction="up" className="min-w-0">
        <div className="space-y-3 sm:space-y-4">
          <ProfileSummaryCard user={user} profile={profile} previewAvatar={preview} onPickAvatar={setFile} />
          <PointsCard />
          <AccountNav />
        </div>
      </Reveal>
      <Reveal delay={0.1} className="min-w-0">
        <Block pad="none" className="p-4 sm:p-8">
          <h1 className="text-xl sm:text-h-page">Mon profil</h1>
          <p className="mb-4 mt-1 text-sm text-ink-2 sm:mb-6 sm:text-sm">Gérez vos informations personnelles et la sécurité de votre compte.</p>
          <Tabs
            variant="pill"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "info", label: "Informations" },
              { value: "security", label: "Sécurité" },
            ]}
          />
          <div className="mt-4 sm:mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[45px]" />
                <Skeleton className="h-[45px]" />
                <Skeleton className="h-[45px]" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  {tab === "info" && <PersonalInfoForm profile={profile} avatarFile={file} onSaved={() => setFile(null)} />}
                  {tab === "security" && <SecuritySettings />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </Block>
      </Reveal>
    </div>
  );
}

export function ProfileView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte" }, { label: "Profil" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Content />
      </AuthGuard>
    </>
  );
}
