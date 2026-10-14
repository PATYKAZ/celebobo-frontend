"use client";

import { Monitor, Moon, Sun1 } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import type { ThemeChoice } from "./theme";
import { useTheme } from "./useTheme";

const LABEL: Record<ThemeChoice, string> = { light: "Clair", dark: "Sombre", system: "Auto" };
const ICON = { light: Sun1, dark: Moon, system: Monitor };

/** Choix du thème : clair, sombre ou celui de l'appareil. `compact` : icônes seules (en-tête). */
export function ThemeSwitch({ compact, fullWidth, className }: { compact?: boolean; fullWidth?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  const options = (["light", "dark", "system"] as const).map((value) => {
    const Icon = ICON[value];
    return {
      value,
      label: compact ? (
        <>
          <Icon size={15} variant="Bold" aria-hidden />
          <span className="sr-only">{value === "system" ? "Thème de l'appareil" : `Thème ${LABEL[value].toLowerCase()}`}</span>
        </>
      ) : (
        // icône et libellé côte à côte (les SVG sont en display:block)
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Icon size={15} variant="Bold" aria-hidden /> {LABEL[value]}
        </span>
      ),
    };
  });
  return <SegmentedControl aria-label="Thème d'affichage" size="sm" fullWidth={fullWidth} className={cn(className)} value={theme} onChange={setTheme} options={options} />;
}

/** Bouton rond qui bascule clair ↔ sombre (barre du back-office). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";
  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"} title={dark ? "Thème clair" : "Thème sombre"} className={className}>
      {dark ? <Sun1 size={19} variant="Bold" /> : <Moon size={19} variant="Bold" />}
    </button>
  );
}
