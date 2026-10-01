"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ArrowDown2, Eye, EyeSlash } from "iconsax-reactjs";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";

interface FieldShellProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}

/** Label + champ + message d'erreur / aide. */
export function FormField({ label, error, hint, required, className, htmlFor, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold leading-[19.5px]">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12px] leading-[18px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-[18px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, wrapperClassName, className, id, type, required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <FormField label={label} error={error} hint={hint} required={required} htmlFor={fid} className={wrapperClassName}>
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">{leftIcon}</span>}
        <input
          ref={ref}
          id={fid}
          type={isPassword && show ? "text" : type}
          required={required}
          aria-invalid={!!error}
          className={cn("field", leftIcon && "pl-10", isPassword && "pr-11", error && "field-error", className)}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
          >
            {show ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </FormField>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, wrapperClassName, className, id, required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FormField label={label} error={error} hint={hint} required={required} htmlFor={fid} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={!!error}
        className={cn("field h-auto min-h-[110px] resize-y py-3", error && "field-error", className)}
        {...rest}
      />
    </FormField>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, wrapperClassName, className, id, required, options, children, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FormField label={label} error={error} hint={hint} required={required} htmlFor={fid} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={!!error}
          className={cn("field appearance-none pr-9 font-medium", error && "field-error", className)}
          {...rest}
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <ArrowDown2 size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-dark2" />
      </div>
    </FormField>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, ...rest }, ref) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-[13px] leading-[19.5px] text-ink-2", className)}>
      <input ref={ref} type="checkbox" className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary" {...rest} />
      <span>{label}</span>
    </label>
  );
});

/** Interrupteur on/off (admin). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-primary" : "bg-line")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
