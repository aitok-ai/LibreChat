import { Bookmark } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface BookmarkEmptyStateProps {
  isFiltered?: boolean;
}

export default function BookmarkEmptyState({ isFiltered = false }: BookmarkEmptyStateProps) {
  const localize = useLocalize();

  return (
    <div className="border-border-light flex flex-col items-center justify-center rounded-lg border bg-transparent p-6 text-center">
      <div className="bg-surface-tertiary mb-2 flex size-10 items-center justify-center rounded-full">
        <Bookmark className="text-text-secondary size-5" aria-hidden="true" />
      </div>
      {isFiltered ? (
        <p className="text-text-secondary text-sm">{localize('com_ui_no_bookmarks_match')}</p>
      ) : (
        <>
          <p className="text-text-primary text-sm font-medium">
            {localize('com_ui_no_bookmarks_title')}
          </p>
          <p className="text-text-secondary mt-0.5 text-xs">
            {localize('com_ui_add_first_bookmark')}
          </p>
        </>
      )}
    </div>
  );
}
