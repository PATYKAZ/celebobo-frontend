"use client";

import { AnimatePresence, motion } from "motion/react";
import { Key, Lock } from "iconsax-reactjs";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Tabs } from "@/shared/ui/Tabs";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useProfile } from "../hooks/useAccount";
import { AddressesForm } from "./AddressesForm";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { ProfileSummaryCard } from "./ProfileSummaryCard";

type Tab = "info" | "addresses" | "security";

function Content() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [tab, setTab] = useState<Tab>("info");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!user) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Reveal direction="right">
        <ProfileSummaryCard user={user} profile={profile} previewAvatar={preview} onPickAvatar={setFile} />
      </Reveal>
      <Reveal delay={0.1}>
        <Block>
          <h1 className="text-h-page text-primary">Mon profil</h1>
          <p className="mb-6 mt-1 text-[14px] text-ink-2">Gérez vos informations personnelles et vos adresses de livraison.</p>
          <Tabs
            variant="pill"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "info", label: "Informations" },
              { value: "addresses", label: "Adresses" },
              { value: "security", label: "Sécurité" },
            ]}
          />
          <div className="mt-6">
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
                  {tab === "addresses" && <AddressesForm profile={profile} />}
                  {tab === "security" && (
                    <div className="flex items-start gap-4 rounded-box bg-page/60 p-5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-100 text-primary"><Lock size={22} variant="Bold" /></span>
                      <div>
                        <h3 className="flex items-center gap-2 text-[16px]"><Key size={16} /> Mot de passe</h3>
                        <p className="mt-1 text-[14px] leading-[22px] text-ink-2">
                          Pour changer votre mot de passe, utilisez le lien « Mot de passe oublié » sur la page de connexion : un e-mail de réinitialisation vous sera envoyé.
                        </p>
                      </div>
                    </div>
                  )}
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
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
