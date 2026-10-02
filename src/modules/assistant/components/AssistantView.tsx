"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft2, Cpu, MagicStar, Refresh2, Send2 } from "iconsax-reactjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
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

/** Hauteur / décalage du viewport visuel : le champ de saisie reste au-dessus du clavier virtuel (iOS & Android). */
function useVisualViewport(enabled: boolean) {
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    if (!enabled || !v) return;
    const on = () => setVv({ height: v.height, top: v.offsetTop });
    on();
    v.addEventListener("resize", on);
    v.addEventListener("scroll", on);
    return () => {
      v.removeEventListener("resize", on);
      v.removeEventListener("scroll", on);
      setVv(null);
    };
  }, [enabled]);
  return vv;
}

export function AssistantView() {
  const router = useRouter();
  const mobile = useMediaQuery("(max-width: 1023px)");
  const vv = useVisualViewport(mobile);
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

  // Mobile : l'assistant occupe tout l'écran (pas de scroll de page derrière)
  useEffect(() => {
    if (!mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobile]);

  const onlyWelcome = messages.length <= 1;
  const back = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));

  return (
    <>
      <div className="max-lg:hidden"><Breadcrumb items={[{ label: "Assistant Celebobo" }]} /></div>
      <Block
        pad="none"
        style={mobile && vv ? { height: vv.height, top: vv.top } : undefined}
        className="overflow-hidden max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[70] max-lg:h-dvh max-lg:rounded-none"
      >
        <div className="flex h-[calc(100vh-150px)] min-h-[560px] max-h-[780px] flex-col max-lg:h-full max-lg:max-h-none max-lg:min-h-0">
          <header className="flex items-center gap-2.5 border-b border-line-3 bg-primary px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))] text-white sm:gap-3 sm:px-5 sm:py-4 lg:pt-4">
            <button onClick={back} aria-label="Retour" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30 active:scale-90 lg:hidden">
              <ArrowLeft2 size={20} />
            </button>
            <span className="relative grid size-11 place-items-center rounded-full bg-white/20">
              <MagicStar size={22} variant="Bold" />
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/30" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] leading-[22px] sm:text-[18px] sm:leading-[24px]">Assistant Celebobo</h1>
              <p className="truncate text-[12px] text-white/80">Conseils produits · Commande · Livraison</p>
            </div>
            <button onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="grid size-10 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30 active:scale-90 sm:size-9">
              <Refresh2 size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#fff,rgba(226,228,235,.35))] px-3 py-4 sm:px-8 sm:py-6">
            {messages.map((m) => {
              const mine = m.role === "user";
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-start gap-3", mine && "justify-end")}>
                  {!mine && <BotAvatar />}
                  <div className={cn("flex min-w-0 max-w-[88%] flex-col gap-3 sm:max-w-[72%]", mine && "items-end")}>
                    <div className={cn("rounded-2xl px-4 py-3 text-[14px] leading-[22px]", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-chip")}>
                      {mine ? m.content : <StreamedText text={m.content} animate={m.animate} onTick={scroll} />}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="no-scrollbar -mx-1 flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [&>*]:snap-start">
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="hidden flex-wrap gap-2 pl-12 sm:flex">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }} onClick={() => send(s)} className="rounded-full border border-primary/40 bg-white px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
            <div ref={end} />
          </div>

          {/* Mobile : suggestions en rangée défilante au-dessus du champ */}
          {onlyWelcome && !loading && (
            <div className="snap-row no-scrollbar border-t border-line-3 bg-white px-3 py-2.5 sm:hidden">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="min-h-10 whitespace-nowrap rounded-full border border-primary/40 bg-white px-4 text-[13px] font-semibold text-primary active:bg-primary active:text-white">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-line-3 bg-white px-3 pt-3 pb-safe sm:p-4">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Posez votre question…" aria-label="Votre message" enterKeyHint="send" autoComplete="off" className="field flex-1" />
            <motion.button whileTap={{ scale: 0.92 }} disabled={!text.trim() || loading} aria-label="Envoyer" className="grid size-12 shrink-0 place-items-center rounded-box bg-primary text-white transition-colors hover:bg-primary-dark disabled:bg-line sm:size-[45px]">
              <Send2 size={20} variant="Bold" />
            </motion.button>
          </form>
        </div>
      </Block>
    </>
  );
}
