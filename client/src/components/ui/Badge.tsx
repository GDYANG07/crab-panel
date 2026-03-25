import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { forwardRef, HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        success:
          'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
        warning:
          'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
        danger:
          'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20',
        info: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20',
        default:
          'bg-[var(--color-border)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
        primary:
          'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20',
      },
      size: {
        sm: 'px-2 py-0 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
