import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]/20';

    const variants = {
      primary:
        'bg-[var(--color-primary)] text-white hover:bg-[#b55a3a] active:bg-[#a04f32] shadow-sm',
      secondary:
        'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-background)] hover:border-[var(--color-text-secondary)] active:bg-[var(--color-border)]',
      ghost:
        'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] active:bg-[var(--color-border)]',
      danger:
        'bg-[var(--color-danger)] text-white hover:bg-[#c93e3d] active:bg-[#b23534] shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
