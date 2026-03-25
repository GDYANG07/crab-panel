import { forwardRef, InputHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, checked, onChange, disabled, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label
        className={`
          inline-flex items-start gap-3 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-11 h-6 bg-[var(--color-border)] rounded-full
              peer-checked:bg-[var(--color-primary)]
              peer-disabled:opacity-50
              transition-colors duration-200 ease-in-out
              after:content-[''] after:absolute after:top-0.5 after:left-0.5
              after:bg-white after:rounded-full after:h-5 after:w-5
              after:transition-all after:duration-200 after:ease-in-out
              peer-checked:after:translate-x-5 peer-checked:after:left-[2px]
              peer-focus:ring-2 peer-focus:ring-[var(--color-primary)]/20
            `}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

export interface ToggleGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ToggleGroup({ children, className = '' }: ToggleGroupProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {children}
    </div>
  );
}
