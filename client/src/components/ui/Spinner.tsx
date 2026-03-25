import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = 'md', className = '' }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={`
          animate-spin text-[var(--color-primary)]
          ${sizeClasses[size]}
          ${className}
        `}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

export function LoadingOverlay({
  message,
  size = 'md',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-background)]/80 backdrop-blur-sm rounded-[12px] z-10">
      <Spinner size={size} />
      {message && (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
      )}
    </div>
  );
}

export function FullPageLoading({
  message = '加载中...',
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <Spinner size="lg" />
      <p className="mt-4 text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
