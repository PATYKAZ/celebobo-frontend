import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "dark" | "outline" | "white" | "chip" | "danger" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  dark: "bg-ink-dark text-white hover:bg-black",
  outline: "border border-primary bg-transparent text-primary hover:bg-primary hover:text-white",
  white: "bg-white text-ink hover:bg-ink hover:text-white",
  chip: "bg-chip text-ink hover:bg-primary hover:text-white",
  danger: "bg-danger text-white hover:bg-[#d62a21]",
  ghost: "bg-transparent text-ink hover:bg-chip",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-[28px] px-3 text-[11px] leading-[16px] rounded-md max-sm:min-h-9",
  sm: "h-[34px] px-4 text-[12px] leading-[18px] rounded-box max-sm:min-h-11",
  md: "h-[45px] px-6 text-[13px] leading-[19px] rounded-box max-sm:min-h-12",
  lg: "h-[52px] px-8 text-[14px] leading-[21px] rounded-box max-sm:min-h-12",
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Majuscules (design : boutons d'action en uppercase) */
  upper?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & { href: string; target?: string; onClick?: () => void; disabled?: boolean };

/** Bouton / lien-bouton du design (rad 10, hover avec reflet). */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", loading, leftIcon, rightIcon, upper = true, fullWidth, className, children, ...rest } = props;
  const classes = cn(
    "group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-medium transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    upper && "uppercase",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
  const content = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -translate-x-[120%] bg-white/25 group-hover:animate-sheen"
      />
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
