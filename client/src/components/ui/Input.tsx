import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      prefix,
      suffix,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputBaseStyles = `
      w-full bg-white border rounded-[12px] px-4 py-2.5
      text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-background)]
      transition-all duration-150
    `;

    const inputVariantStyles = error
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
      : 'border-[var(--color-border)] focus:border-[var(--color-primary)] hover:border-[var(--color-text-secondary)]';

    const paddingStyles = {
      left: prefix ? 'pl-11' : 'pl-4',
      right: suffix ? 'pr-11' : 'pr-4',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              ${inputBaseStyles}
              ${inputVariantStyles}
              ${paddingStyles.left}
              ${paddingStyles.right}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {suffix}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-sm text-[var(--color-danger)]">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
