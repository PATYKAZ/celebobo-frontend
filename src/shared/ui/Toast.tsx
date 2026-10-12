"use client";

import { CloseCircle, InfoCircle, TickCircle } from "@/shared/ui/icons";
import { toast as sonner, Toaster as SonnerToaster } from "sonner";

/**
 * API impérative : toast.success("Titre", "description") — utilisable partout (Sonner).
 * Les erreurs restent affichées plus longtemps : elles demandent souvent une action.
 */
export const toast = {
  success: (title: string, description?: string) => sonner.success(title, { description }),
  error: (title: string, description?: string) => sonner.error(title, { description, duration: 6000 }),
  info: (title: string, description?: string) => sonner.info(title, { description }),
};

/**
 * À monter une fois (providers). En haut à droite sur desktop, pleine largeur en haut sur mobile.
 * Pause au survol / focus, balayage pour fermer, Alt+T pour atteindre les notifications au clavier.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      visibleToasts={4}
      closeButton
      offset={20}
      mobileOffset={{ top: "max(12px, env(safe-area-inset-top))", left: 16, right: 16 }}
      containerAriaLabel="Notifications"
      icons={{
        success: <TickCircle size={22} variant="Bold" className="text-primary" />,
        error: <CloseCircle size={22} variant="Bold" className="text-danger" />,
        info: <InfoCircle size={22} variant="Bold" className="text-info" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Fermer",
        classNames: {
          toast:
            "group relative flex w-full items-start gap-3 rounded-box border-l-4 border-info bg-surface p-4 pr-10 font-sans text-ink shadow-[0_8px_30px_rgba(0,0,0,.12)] sm:w-[360px]",
          success: "border-primary",
          error: "border-danger",
          info: "border-info",
          icon: "mt-px shrink-0",
          content: "min-w-0 flex-1",
          title: "text-[14px] font-bold leading-[20px]",
          description: "mt-0.5 line-clamp-2 text-[13px] leading-[18px] text-ink-2",
          closeButton:
            "absolute right-2 top-2 grid size-8 place-items-center rounded-full text-[18px] leading-none text-ink-3 transition-colors hover:text-ink [&_svg]:size-3.5",
        },
      }}
    />
  );
}
