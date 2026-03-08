import { cn } from '~/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface-tertiary animate-pulse rounded-md opacity-50 dark:opacity-25',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
