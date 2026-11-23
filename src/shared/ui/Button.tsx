import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

/**
 * Trois rôles et un bouton discret :
 * - primary : l'action principale de l'écran (une seule par zone) ;
 * - secondary : les autres actions ;
 * - danger : supprimer, annuler, désactiver ;
 * - ghost : action tertiaire sans fond (liens d'action dans une liste, barres d'outils denses).
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
  secondary: "border border-line bg-surface text-ink hover:border-primary hover:text-primary active:bg-primary-50",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
  ghost: "bg-transparent text-ink hover:bg-chip active:bg-chip",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs rounded-md max-sm:min-h-9",
  sm: "h-9 px-4 text-sm rounded-md max-sm:min-h-11",
  md: "h-11 px-5 text-sm rounded-box max-sm:min-h-12",
  lg: "h-12 px-6 text-base rounded-box",
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Majuscules : réservé aux sigles très courts ; les libellés restent en casse de phrase. */
  upper?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & { href: string; target?: string; onClick?: () => void; disabled?: boolean };

/** Bouton / lien-bouton : retour au pressé (léger enfoncement), états de survol et désactivé distincts. */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", loading, leftIcon, rightIcon, upper = false, fullWidth, className, children, ...rest } = props;
  const classes = cn(
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    upper && "uppercase",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
  const content = (
    <>
      {loading ? <Spinner size={16} className="text-current" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, ...a } = rest as LinkProps;
    return (
      <Link href={href} className={classes} {...(a as object)}>
        {content}
      </Link>
    );
  }
  const { type = "button", disabled, ...b } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} disabled={disabled || loading} className={classes} {...b}>
      {content}
    </button>
  );
}
