import { Brain } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface MemoryEmptyStateProps {
  isFiltered?: boolean;
}

export default function MemoryEmptyState({ isFiltered = false }: MemoryEmptyStateProps) {
  const localize = useLocalize();

  return (
    <div className="border-border-light flex flex-col items-center justify-center rounded-lg border bg-transparent p-6 text-center">
      <div className="bg-surface-tertiary mb-2 flex size-10 items-center justify-center rounded-full">
        <Brain className="text-text-secondary size-5" aria-hidden="true" />
      </div>
      {isFiltered ? (
        <p className="text-text-secondary text-sm">{localize('com_ui_no_memories_match')}</p>
      ) : (
        <>
          <p className="text-text-primary text-sm font-medium">
            {localize('com_ui_no_memories_title')}
          </p>
          <p className="text-text-secondary mt-0.5 text-xs">{localize('com_ui_no_memories')}</p>
        </>
      )}
    </div>
  );
}
