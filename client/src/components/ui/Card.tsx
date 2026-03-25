import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { forwardRef, HTMLAttributes, ReactNode } from 'react';

const cardVariants = cva(
  'bg-[var(--color-card)] border border-[var(--color-border)] rounded-[12px] transition-shadow',
  {
    variants: {
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hoverable: {
        true: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
        false: '',
      },
    },
    defaultVariants: {
      padding: 'md',
      hoverable: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      padding,
      title,
      description,
      headerAction,
      hoverable = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ padding, hoverable }), className)}
        {...props}
      >
        {(title || description || headerAction) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {headerAction && <div className="ml-4">{headerAction}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
