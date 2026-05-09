import { InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  label,
  error,
  className = "",
  id,
  required,
  ref,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
        >
          {label}
          {required ? <span className="text-[var(--color-error)] ml-0.5">*</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm transition-all placeholder:text-[var(--color-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] disabled:bg-[var(--color-surface-raised)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed ${
          error ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/40" : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        required={required}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}
