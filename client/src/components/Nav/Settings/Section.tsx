import type { ReactNode } from 'react';
import { cn } from '~/utils';

interface SectionProps {
  heading: string;
  danger?: boolean;
  children: ReactNode;
}

export default function Section({ heading, danger, children }: SectionProps) {
  return (
    <section className="mb-7">
      <h3
        className={cn(
          'mb-2 px-1 text-xs font-semibold tracking-wide uppercase',
          danger ? 'text-red-500' : 'text-text-secondary',
        )}
      >
        {heading}
      </h3>
      <div
        className={cn(
          'divide-border-light text-text-primary divide-y overflow-hidden rounded-xl border text-sm',
          danger ? 'border-red-500/30' : 'border-border-light',
        )}
      >
        {children}
      </div>
    </section>
  );
}
