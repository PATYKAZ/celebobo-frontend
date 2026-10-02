"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ArrowRight2, Key, Location, Lock, Notification, Receipt2 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
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
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Reveal direction="up" className="min-w-0">
        <div className="space-y-3 sm:space-y-4">
          <ProfileSummaryCard user={user} profile={profile} previewAvatar={preview} onPickAvatar={setFile} />
          <Block pad="sm" className="!p-2">
            {[
              { href: ROUTES.orders, label: "Mes commandes", icon: Receipt2 },
              { href: ROUTES.addresses, label: "Mon carnet d'adresses", icon: Location },
              { href: ROUTES.settings, label: "Notifications & préférences", icon: Notification },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="group flex min-h-12 items-center gap-3 rounded-box px-3 py-2 text-[14px] font-semibold transition-colors hover:bg-chip active:bg-chip">
                <span className="grid size-9 place-items-center rounded-full bg-chip transition-colors group-hover:bg-primary group-hover:text-white"><Icon size={17} /></span>
                <span className="flex-1">{label}</span>
                <ArrowRight2 size={14} className="text-ink-3 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </Block>
        </div>
      </Reveal>
      <Reveal delay={0.1} className="min-w-0">
        <Block pad="none" className="p-4 sm:p-[30px]">
          <h1 className="text-[22px] leading-[28px] text-primary sm:text-h-page">Mon profil</h1>
          <p className="mb-4 mt-1 text-[13px] leading-[19px] text-ink-2 sm:mb-6 sm:text-[14px]">Gérez vos informations personnelles et vos adresses de livraison.</p>
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
                  {tab === "addresses" && (
                    <div className="space-y-6">
                      <Link href={ROUTES.addresses} className="flex min-h-14 items-center gap-3 rounded-box bg-primary-50 p-3.5 text-[14px] font-semibold text-primary-dark transition-colors hover:bg-primary-100 active:scale-[0.99] sm:p-4">
                        <Location size={20} variant="Bold" className="shrink-0" /> <span className="min-w-0 flex-1">Gérer mon carnet d&apos;adresses <span className="hidden sm:inline">(plusieurs adresses, adresse par défaut)</span></span> <ArrowRight2 size={14} className="shrink-0" />
                      </Link>
                      <AddressesForm profile={profile} />
                    </div>
                  )}
                  {tab === "security" && (
                    <div className="flex items-start gap-3 rounded-box bg-page/60 p-4 sm:gap-4 sm:p-5">
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
