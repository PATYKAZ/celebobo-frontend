"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp2 } from "iconsax-reactjs";
import { useEffect, useState } from "react";

export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          aria-label="Remonter en haut"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 grid size-11 place-items-center rounded-full bg-primary text-white shadow-[0_6px_20px_rgba(26,186,26,.45)] transition-transform hover:-translate-y-1"
        >
          <ArrowUp2 size={20} variant="Bold" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
