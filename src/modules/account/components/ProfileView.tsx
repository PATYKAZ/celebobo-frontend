"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ArrowRight2, Call, Location, Notification, Receipt2, User } from "iconsax-reactjs";
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
import { useAddresses } from "../hooks/useAddressBook";
import { addressIcon } from "./AddressBookView";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { SecuritySettings } from "./SecuritySettings";

type Tab = "info" | "addresses" | "security";

/** Adresse par défaut du carnet (l'API n'a pas d'adresse sur le profil). */
function DefaultAddress() {
  const { data, isLoading } = useAddresses();
  const a = data?.find((x) => x.isDefault) ?? data?.[0];
  if (isLoading) return <Skeleton className="h-[120px] !rounded-box" />;
  if (!a) return <p className="rounded-box bg-page/60 p-4 text-[14px] text-ink-2">Aucune adresse enregistrée pour le moment.</p>;
  const Icon = addressIcon(a.label);
  return (
    <div className="flex items-start gap-3 rounded-box border-2 border-primary bg-primary-50 p-4 sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white"><Icon size={20} variant="Bold" /></span>
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
  );
}

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
                      <DefaultAddress />
                    </div>
                  )}
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
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
