"use client";

import { motion } from "motion/react";
import { Camera, Copy, People, TickCircle } from "iconsax-reactjs";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { Block } from "@/shared/ui/Block";
import { toast } from "@/shared/ui/Toast";
import { CountUp } from "@/shared/animations/CountUp";
import { displayName, type User } from "@/modules/auth/types";
import type { Profile } from "../types";

const ROLE_LABEL: Record<User["role"], string> = { client: "Client", revendeur: "Revendeur", mukubwa: "Responsable", admin: "Administrateur" };

interface Props {
  user: User;
  profile?: Profile;
  /** Aperçu local de l'avatar choisi (avant enregistrement) */
  previewAvatar: string | null;
  onPickAvatar: (file: File) => void;
}

export function ProfileSummaryCard({ user, profile, previewAvatar, onPickAvatar }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const code = profile?.codeRevendeur ?? user.codeRevendeur;
  const name = displayName(user);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copié", code);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <Block className="overflow-hidden !p-0">
      <div className="relative h-24 bg-primary">
        <motion.span aria-hidden className="absolute -right-6 -top-10 size-40 rounded-full bg-white/10" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.span aria-hidden className="absolute left-10 top-8 size-20 rounded-full bg-white/10" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity }} />
      </div>
      <div className="px-6 pb-6">
        <div className="relative -mt-12 w-fit">
          <Avatar src={previewAvatar ?? profile?.avatar ?? user.avatar} name={name} size={96} className="ring-4 ring-white" />
          <button onClick={() => input.current?.click()} aria-label="Changer la photo" className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-primary text-white ring-4 ring-white transition-transform hover:scale-110">
            <Camera size={17} variant="Bold" />
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickAvatar(f);
            }}
          />
        </div>
        <h2 className="mt-4 text-[20px] leading-[26px]">{name}</h2>
        <p className="break-all text-[13px] text-ink-3">{user.email}</p>
        <span className="mt-3 inline-block rounded-full bg-primary-100 px-3 py-1 text-[12px] font-bold text-primary-dark">{ROLE_LABEL[user.role]}</span>

        {code && (
          <div className="mt-6 rounded-box border border-dashed border-primary/50 bg-primary-50 p-4">
            <p className="text-[12px] font-semibold uppercase text-ink-2">Mon code revendeur</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[30px] font-extrabold leading-[36px] tracking-[0.2em] text-primary">{code}</span>
              <button onClick={copy} aria-label="Copier le code" className={cn("grid size-10 place-items-center rounded-full transition-colors", copied ? "bg-primary text-white" : "bg-white text-ink hover:bg-primary hover:text-white")}>
                {copied ? <TickCircle size={18} variant="Bold" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-2">
              <People size={16} variant="Bold" className="text-primary" />
              <strong className="text-ink"><CountUp to={profile?.invitedCount ?? 0} /></strong> client(s) invité(s)
            </p>
          </div>
        )}
      </div>
    </Block>
  );
}
