import { cn } from '../../lib/utils';

interface SkeletonProps {
  variant?: 'circle' | 'rect' | 'text';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'bg-[var(--color-border)] animate-pulse rounded-[8px]';

  const variantStyles = {
    circle: 'rounded-full',
    rect: 'rounded-[8px]',
    text: 'rounded-[4px]',
  };

  const getDimension = (value: string | number | undefined) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles[variant], className)}
            style={{
              width: i === lines - 1 ? '75%' : getDimension(width) || '100%',
              height: getDimension(height) || '1em',
            }}
          />
        ))}
      </div>
    );
  }

  const defaultDimensions = {
    circle: { width: 40, height: 40 },
    rect: { width: '100%', height: 100 },
    text: { width: '100%', height: '1em' },
  };

  const defaults = defaultDimensions[variant];

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{
        width: getDimension(width) || getDimension(defaults.width),
        height: getDimension(height) || getDimension(defaults.height),
      }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[12px]',
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" className="mt-2" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-[var(--color-border)]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton variant="text" width="80%" />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 py-4 border-b border-[var(--color-border)]"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton variant="text" width={`${60 + Math.random() * 40}%`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
