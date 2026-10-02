"use client";

import { motion } from "motion/react";
import { TickCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { CHECKOUT_STEPS } from "../types";

export function CheckoutStepper({ step }: { step: number }) {
  return (
    <>
      {/* Mobile : titre d'étape + barre segmentée */}
      <div className="sm:hidden" role="group" aria-label={`Étape ${step + 1} sur ${CHECKOUT_STEPS.length}`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[16px] font-bold leading-[22px]">{CHECKOUT_STEPS[step]}</p>
          <p className="text-[12px] font-semibold text-ink-3">Étape {step + 1}/{CHECKOUT_STEPS.length}</p>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {CHECKOUT_STEPS.map((l, i) => (
            <span key={l} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-3">
              <motion.span className="block h-full origin-left bg-primary" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.45 }} />
            </span>
          ))}
        </div>
      </div>
      <Desktop step={step} />
    </>
  );
}

function Desktop({ step }: { step: number }) {
  return (
    <ol className="hidden items-center sm:flex" aria-label="Étapes de la commande">
      {CHECKOUT_STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ scale: active ? 1.1 : 1 }}
                className={cn("grid size-10 place-items-center rounded-full text-[15px] font-bold transition-colors duration-300", done || active ? "bg-primary text-white" : "bg-chip text-ink-3")}
              >
                {done ? <TickCircle size={22} variant="Bold" /> : i + 1}
              </motion.span>
              <span className={cn("hidden text-[14px] font-semibold sm:block", active ? "text-ink" : done ? "text-primary" : "text-ink-3")}>{label}</span>
            </div>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-line-3 sm:mx-5">
                <motion.span className="block h-full origin-left bg-primary" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.5 }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
