import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useListSkillsQuery } from '~/data-provider';
import { useDebounce, useHasAccess, useLocalize } from '~/hooks';
import { CreateSkillMenu } from '../buttons';
import SkillListPanel from '../lists/SkillList';
import { cn } from '~/utils';

interface SkillsSidePanelProps {
  className?: string;
}

/**
 * Claude.ai–style skills sidebar panel.
 * Header: "Skills" title + search icon + create menu (+ dropdown).
 * Body: "My Skills" collapsible section with skill list.
 */
export default function SkillsSidePanel({ className }: SkillsSidePanelProps) {
  const localize = useLocalize();
  const { skillId: activeSkillId } = useParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const hasCreateAccess = useHasAccess({
    permissionType: PermissionTypes.SKILLS,
    permission: Permissions.CREATE,
  });

  const listQuery = useListSkillsQuery({ search: debouncedSearch || undefined, limit: 50 });
  const skills = useMemo(() => listQuery.data?.skills ?? [], [listQuery.data]);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      className={cn(
        'border-border-light flex h-full w-full flex-col overflow-hidden border-r',
        className,
      )}
    >
      {/* Header — title+icons or inline search input */}
      <div className="flex items-center justify-between px-4 py-2">
        {searchOpen ? (
          <>
            <div className="relative flex-1">
              <Search className="text-text-secondary absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={localize('com_ui_search')}
                aria-label={localize('com_ui_search_skills')}
                className="border-border-light text-text-primary placeholder:text-text-secondary focus-visible:ring-ring-primary h-8 w-full rounded-md border bg-transparent pr-3 pl-8 text-sm focus-visible:ring-1 focus-visible:outline-none"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleCloseSearch}
              className="text-text-secondary hover:bg-surface-hover hover:text-text-primary ml-2 inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label={localize('com_ui_close')}
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <h2 className="text-text-primary truncate text-lg font-bold">
              {localize('com_ui_skills')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="text-text-secondary hover:bg-surface-hover hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md transition-colors"
                aria-label={localize('com_ui_search')}
              >
                <Search className="size-4" />
              </button>
              {hasCreateAccess && <CreateSkillMenu />}
            </div>
          </>
        )}
      </div>

      {/* Skill list */}
      <div className="flex-1 overflow-y-auto px-4">
        <SkillListPanel
          skills={skills as unknown as import('librechat-data-provider').TSkill[]}
          isLoading={listQuery.isLoading}
          activeSkillId={activeSkillId}
        />
      </div>
    </div>
  );
}
