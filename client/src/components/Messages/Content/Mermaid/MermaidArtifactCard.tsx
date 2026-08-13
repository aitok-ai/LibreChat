import React, { forwardRef } from 'react';
import { Workflow } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';
import cn from '~/utils/cn';

interface MermaidArtifactCardProps {
  artifactId: string;
  isSelected: boolean;
  title: string;
  onClick: () => void;
}

const MermaidArtifactCard = forwardRef<HTMLButtonElement, MermaidArtifactCardProps>(
  ({ artifactId, isSelected, title, onClick }, ref) => {
    const localize = useLocalize();
    const actionLabel = isSelected
      ? localize('com_ui_close_artifact')
      : localize('com_ui_open_artifact');

    return (
      <Button
        ref={ref}
        variant="subtle"
        aria-controls="artifact-viewer"
        aria-expanded={isSelected}
        data-artifact-trigger={artifactId}
        onClick={onClick}
        className={cn(
          'group my-2 h-auto w-fit max-w-full justify-start gap-2 overflow-hidden rounded-xl p-2 text-left text-sm whitespace-normal shadow-sm',
          'border-border-light bg-surface-tertiary hover:bg-surface-hover transition-all duration-200 active:scale-[0.99] motion-reduce:transition-none',
          isSelected && 'border-border-medium bg-surface-hover',
        )}
      >
        <span className="bg-status-info-subtle text-status-info flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Workflow className="size-4" aria-hidden="true" />
        </span>
        <span className="max-w-64 min-w-0 flex-1 overflow-hidden">
          <span className="text-text-primary block truncate font-medium">{title}</span>
          <span className="text-text-secondary block truncate text-xs font-normal">
            {actionLabel}
          </span>
        </span>
      </Button>
    );
  },
);

MermaidArtifactCard.displayName = 'MermaidArtifactCard';

export default MermaidArtifactCard;
