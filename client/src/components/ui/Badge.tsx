import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { forwardRef, HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      type: {
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
    },
    defaultVariants: {
      type: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, type, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ type }), className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
