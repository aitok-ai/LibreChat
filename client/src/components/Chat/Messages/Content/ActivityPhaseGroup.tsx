import { ChevronDown, ListTree } from 'lucide-react';
import { ContentTypes } from 'librechat-data-provider';
import type { TMessageContentParts } from 'librechat-data-provider';
import type { ReactNode } from 'react';
import { getActivityLabelText } from '~/utils/activityLabels';
import { EmptyText } from './Parts';
import Container from './Container';
import { cn } from '~/utils';

type ActivityPhasePart = Extract<TMessageContentParts, { type: ContentTypes.ACTIVITY_LABEL }> & {
  activity_label_type?: 'phase';
  activity_start_index?: number;
};

export default function ActivityPhaseGroup({
  labelPart,
  children,
  hasContent,
  showCursor = false,
}: {
  labelPart: ActivityPhasePart;
  children: ReactNode;
  hasContent: boolean;
  showCursor?: boolean;
}) {
  const label = getActivityLabelText(labelPart);
  const hasFailure = labelPart.status === 'failed' || labelPart.status === 'partial';
  const cursor = showCursor ? (
    <Container>
      <EmptyText />
    </Container>
  ) : null;
  if (!label) {
    return <>{children}</>;
  }
  const group = !hasContent ? (
    <div className="border-border-light bg-surface-secondary/40 text-text-secondary my-2 flex min-h-10 w-full items-center gap-2 rounded-lg border px-3 py-2">
      <ListTree
        className={cn('size-4 shrink-0', hasFailure && 'text-amber-600 dark:text-amber-400')}
        aria-hidden="true"
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm font-medium',
          hasFailure && 'text-amber-600 dark:text-amber-400',
        )}
        role="status"
        title={label}
      >
        {label}
      </span>
    </div>
  ) : (
    <details className="group/activity-phase border-border-light bg-surface-secondary/40 my-2 w-full rounded-lg border">
      <summary
        className="text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:ring-ring-primary flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden"
        aria-label={label}
        title={label}
      >
        <ListTree
          className={cn('size-4 shrink-0', hasFailure && 'text-amber-600 dark:text-amber-400')}
          aria-hidden="true"
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm font-medium',
            hasFailure && 'text-amber-600 dark:text-amber-400',
          )}
          role="status"
        >
          {label}
        </span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform duration-200 group-open/activity-phase:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-border-light border-t px-3 py-2">{children}</div>
    </details>
  );
  return (
    <>
      {group}
      {cursor}
    </>
  );
}
