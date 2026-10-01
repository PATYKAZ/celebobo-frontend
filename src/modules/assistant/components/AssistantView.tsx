"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Cpu, MagicStar, Refresh2, Send2 } from "iconsax-reactjs";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Price } from "@/shared/ui/Price";
import { getPricing } from "@/modules/products/utils";
import type { Product } from "@/modules/products/types";
import { useAssistant } from "../hooks/useAssistant";
import { SUGGESTIONS } from "../types";
import { StreamedText } from "./StreamedText";

function BotAvatar() {
  return (
    <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white">
      <Cpu size={18} variant="Bold" />
      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-sun ring-2 ring-white" />
    </span>
  );
}

function ProductSuggestion({ product, index }: { product: Product; index: number }) {
  const pr = getPricing(product);
  return (
    <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15 * index + 0.2 }}>
      <Link href={ROUTES.product(product.id)} className="group flex w-[200px] shrink-0 flex-col overflow-hidden rounded-box border border-line-3 bg-white transition-all hover:-translate-y-1 hover:border-primary">
        <span className="relative block aspect-[4/3] overflow-hidden bg-page">
          {product.image && <Image src={product.image} alt={product.name} fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
          {pr.onSale && <span className="absolute left-2 top-2 rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">-{pr.percent}%</span>}
        </span>
        <span className="p-3">
          <span className="line-clamp-2 block min-h-[34px] text-[13px] font-bold leading-[17px]">{product.name}</span>
          <Price current={pr.current} original={pr.original} size="sm" className="mt-1.5" />
        </span>
      </Link>
    </motion.div>
  );
}

export function AssistantView() {
  const { messages, loading, send, reset } = useAssistant();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const scroll = useCallback(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scroll();
  }, [messages.length, loading, scroll]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || loading) return;
    send(text);
    setText("");
  };

  const onlyWelcome = messages.length <= 1;

  return (
    <>
      <Breadcrumb items={[{ label: "Assistant Celebobo" }]} />
      <Block pad="none" className="overflow-hidden">
        <div className="flex h-[calc(100vh-150px)] min-h-[560px] max-h-[780px] flex-col">
          <header className="flex items-center gap-3 border-b border-line-3 bg-primary px-5 py-4 text-white">
            <span className="relative grid size-11 place-items-center rounded-full bg-white/20">
              <MagicStar size={22} variant="Bold" />
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/30" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] leading-[24px]">Assistant Celebobo</h1>
              <p className="text-[12px] text-white/80">Conseils produits · Commande · Livraison</p>
            </div>
            <button onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="grid size-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30">
              <Refresh2 size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fff,rgba(226,228,235,.35))] px-3 py-6 sm:px-8">
            {messages.map((m) => {
              const mine = m.role === "user";
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-start gap-3", mine && "justify-end")}>
                  {!mine && <BotAvatar />}
                  <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-3 sm:max-w-[72%]", mine && "items-end")}>
                    <div className={cn("rounded-2xl px-4 py-3 text-[14px] leading-[22px]", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-chip")}>
                      {mine ? m.content : <StreamedText text={m.content} animate={m.animate} onTick={scroll} />}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="no-scrollbar -mx-1 flex max-w-full gap-3 overflow-x-auto px-1 pb-1">
                        {m.products.map((p, i) => <ProductSuggestion key={p.id} product={p} index={i} />)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                  <BotAvatar />
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-chip px-4 py-3.5" aria-label="L'assistant écrit">
                    {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-typing-dot rounded-full bg-ink-3" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {onlyWelcome && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-2 pl-12">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }} onClick={() => send(s)} className="rounded-full border border-primary/40 bg-white px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-line-3 p-3 sm:p-4">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Posez votre question…" aria-label="Votre message" className="field flex-1" />
            <motion.button whileTap={{ scale: 0.92 }} disabled={!text.trim() || loading} aria-label="Envoyer" className="grid size-[45px] place-items-center rounded-box bg-primary text-white transition-colors hover:bg-primary-dark disabled:bg-line">
              <Send2 size={20} variant="Bold" />
            </motion.button>
          </form>
        </div>
      </Block>
    </>
  );
}
