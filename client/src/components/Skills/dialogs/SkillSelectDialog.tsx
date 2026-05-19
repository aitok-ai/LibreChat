import { useState, useMemo, useCallback } from 'react';
import { Search, Check, EarthIcon, User, Plus, Star, ListFilter, X } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { OGDialog, OGDialogContent } from '@librechat/client';
import { PermissionTypes, Permissions, SystemCategories } from 'librechat-data-provider';
import type { TSkillSummary } from 'librechat-data-provider';
import type { AgentForm } from '~/common';
import {
  useLocalize,
  useAuthContext,
  useCategories,
  useHasAccess,
  useSkillFavorites,
} from '~/hooks';
import { useListSkillsQuery } from '~/data-provider';
import { CategoryIcon } from '~/components/Prompts';
import { cn } from '~/utils';

interface SkillSelectDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface SkillCategory {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const SKILL_MY = '__skill_filter_my__';
const SKILL_FAVORITES = '__skill_filter_favorites__';
const LIST_QUERY_OPTIONS = { limit: 100 } as const;

interface SidebarItemProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: (value: string) => void;
}

function SidebarItem({ value, label, icon, active, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
        active
          ? 'bg-surface-active text-text-primary'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
      )}
      aria-pressed={active}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

interface SkillCardProps {
  skill: TSkillSummary;
  selected: boolean;
  isFavorite: boolean;
  isShared: boolean;
  isPublic: boolean;
  onToggle: (skillId: string) => void;
  onToggleFavorite: (skillId: string) => void;
  localize: ReturnType<typeof useLocalize>;
}

function SkillCard({
  skill,
  selected,
  isFavorite,
  isShared,
  isPublic,
  onToggle,
  onToggleFavorite,
  localize,
}: SkillCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(skill._id)}
      onMouseDown={(e) => e.preventDefault()}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-32 cursor-pointer flex-col rounded-xl border p-3.5 text-left transition-all duration-200',
        'focus-visible:ring-ring-primary focus:outline-none focus-visible:ring-2',
        selected
          ? 'border-green-500/70 bg-green-500/[0.06]'
          : 'border-border-light hover:border-border-medium hover:bg-surface-tertiary',
      )}
    >
      <div className="flex w-full items-start gap-2">
        <p className="text-text-primary min-w-0 flex-1 truncate pr-1 text-sm font-semibold">
          {skill.name}
        </p>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(skill._id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(skill._id);
            }
          }}
          className={cn(
            'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors',
            isFavorite
              ? 'text-yellow-500 hover:bg-yellow-500/10'
              : 'text-text-tertiary hover:bg-surface-hover hover:text-text-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
          aria-label={isFavorite ? localize('com_ui_unfavorite') : localize('com_ui_favorite')}
          aria-pressed={isFavorite}
        >
          <Star className={cn('size-4', isFavorite && 'fill-current')} aria-hidden="true" />
        </span>
      </div>
      {skill.description && (
        <p className="text-text-secondary mt-1 line-clamp-2 text-xs leading-relaxed">
          {skill.description}
        </p>
      )}
      <div className="mt-auto flex w-full items-center gap-1.5 pt-2">
        {skill.category && (
          <span className="bg-surface-tertiary text-text-tertiary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
            <CategoryIcon category={skill.category} className="size-2.5" />
            {skill.category}
          </span>
        )}
        {isShared && (
          <span
            className="bg-surface-tertiary text-text-tertiary inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
            title={skill.authorName}
            aria-label={skill.authorName}
          >
            <User className="size-2.5" aria-hidden="true" />
          </span>
        )}
        {isPublic && (
          <span
            className="bg-surface-tertiary text-text-tertiary inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
            title={localize('com_ui_sr_public_skill')}
            aria-label={localize('com_ui_sr_public_skill')}
          >
            <EarthIcon className="size-2.5" aria-hidden="true" />
          </span>
        )}
        <span
          className={cn(
            'ml-auto flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            selected ? 'scale-100 bg-green-500 text-white opacity-100' : 'scale-75 opacity-0',
          )}
          aria-hidden="true"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      </div>
    </button>
  );
}

function SkillSelectDialog({ isOpen, setIsOpen }: SkillSelectDialogProps) {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { control, setValue } = useFormContext<AgentForm>();
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(SystemCategories.ALL);
  const { isFavorite: isFavoriteSkill, toggle: toggleFavoriteSkill } = useSkillFavorites();

  const hasCreateAccess = useHasAccess({
    permissionType: PermissionTypes.SKILLS,
    permission: Permissions.CREATE,
  });

  const { data: skillsData } = useListSkillsQuery(LIST_QUERY_OPTIONS);
  const { categories } = useCategories({ className: 'size-4', hasAccess: true });
  const typedCategories = categories as SkillCategory[] | undefined;

  const allSkills = useMemo(() => skillsData?.skills ?? [], [skillsData?.skills]);

  const watchedSkills = useWatch({ control, name: 'skills' });
  const selectedSet = useMemo(
    () => new Set<string>(Array.isArray(watchedSkills) ? watchedSkills : []),
    [watchedSkills],
  );

  const handleToggleSkill = useCallback(
    (skillId: string) => {
      const current = Array.isArray(watchedSkills) ? watchedSkills : [];
      if (current.includes(skillId)) {
        setValue(
          'skills',
          current.filter((id) => id !== skillId),
          { shouldDirty: true },
        );
      } else {
        setValue('skills', [...current, skillId], { shouldDirty: true });
      }
    },
    [watchedSkills, setValue],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchValue('');
    setActiveFilter(SystemCategories.ALL);
  }, [setIsOpen]);

  const handleCreate = useCallback(() => {
    setIsOpen(false);
    navigate('/skills/new');
  }, [navigate, setIsOpen]);

  const visibleSkills = useMemo(() => {
    const term = searchValue.toLowerCase();
    const result: TSkillSummary[] = [];
    for (const skill of allSkills) {
      if (activeFilter === SKILL_MY) {
        if (skill.author !== user?.id) continue;
      } else if (activeFilter === SKILL_FAVORITES) {
        if (!isFavoriteSkill(skill._id)) continue;
      } else if (activeFilter === SystemCategories.NO_CATEGORY) {
        if (skill.category) continue;
      } else if (activeFilter !== SystemCategories.ALL) {
        if (skill.category !== activeFilter) continue;
      }
      if (term && !skill.name.toLowerCase().includes(term)) continue;
      result.push(skill);
    }
    return result;
  }, [allSkills, activeFilter, searchValue, user?.id, isFavoriteSkill]);

  return (
    <OGDialog open={isOpen} onOpenChange={setIsOpen}>
      <OGDialogContent
        className="border-border-medium w-11/12 max-w-[1024px] overflow-hidden rounded-2xl p-0 shadow-xl md:max-h-[85vh]"
        showCloseButton={false}
      >
        <div className="flex h-[80vh] max-h-[720px]">
          <aside className="border-border-light bg-surface-primary-alt flex w-56 shrink-0 flex-col gap-1 border-r p-3">
            <h2 className="text-text-primary px-2.5 pt-1 pb-1.5 text-base font-bold">
              {localize('com_ui_add_skills')}
            </h2>
            {hasCreateAccess && (
              <button
                type="button"
                onClick={handleCreate}
                className="border-border-light text-text-primary hover:border-border-medium hover:bg-surface-hover mb-1 flex w-full items-center justify-center gap-2 rounded-lg border bg-transparent px-2.5 py-1.5 text-center text-sm transition-colors"
                aria-label={localize('com_ui_create_skill')}
              >
                <Plus className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{localize('com_ui_create_skill')}</span>
              </button>
            )}
            <SidebarItem
              value={SKILL_MY}
              label={localize('com_ui_my_skills')}
              icon={<User className="text-text-secondary size-4" />}
              active={activeFilter === SKILL_MY}
              onSelect={setActiveFilter}
            />
            <SidebarItem
              value={SKILL_FAVORITES}
              label={localize('com_ui_favorites')}
              icon={<Star className="text-text-secondary size-4" />}
              active={activeFilter === SKILL_FAVORITES}
              onSelect={setActiveFilter}
            />
            <div className="bg-border-light my-2 h-px" />
            <SidebarItem
              value={SystemCategories.ALL}
              label={localize('com_ui_all_proper')}
              icon={<ListFilter className="text-text-secondary size-4" />}
              active={activeFilter === SystemCategories.ALL}
              onSelect={setActiveFilter}
            />
            {typedCategories?.map((category) => {
              if (!category.value) {
                return null;
              }
              return (
                <SidebarItem
                  key={category.value}
                  value={category.value}
                  label={category.label}
                  icon={category.icon ?? <ListFilter className="text-text-secondary size-4" />}
                  active={activeFilter === category.value}
                  onSelect={setActiveFilter}
                />
              );
            })}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 px-6 py-4">
              <div className="relative flex-1">
                <Search
                  className="text-text-tertiary absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={localize('com_ui_search_skills')}
                  aria-label={localize('com_ui_search_skills')}
                  className="border-border-light text-text-primary placeholder:text-text-tertiary focus:border-border-medium focus-visible:ring-ring-primary h-10 w-full rounded-xl border bg-transparent pr-3 pl-9 text-sm focus:outline-none focus-visible:ring-2"
                />
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="border-border-light text-text-secondary hover:border-border-medium hover:bg-surface-hover hover:text-text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border bg-transparent transition-colors"
                aria-label={localize('com_ui_close')}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4"
              role="group"
              aria-label={localize('com_ui_add_skills')}
            >
              {visibleSkills.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {visibleSkills.map((skill) => (
                    <SkillCard
                      key={skill._id}
                      skill={skill}
                      selected={selectedSet.has(skill._id)}
                      isFavorite={isFavoriteSkill(skill._id)}
                      isShared={skill.author !== user?.id && Boolean(skill.authorName)}
                      isPublic={skill.isPublic === true}
                      onToggle={handleToggleSkill}
                      onToggleFavorite={toggleFavoriteSkill}
                      localize={localize}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="text-text-tertiary size-8 opacity-40" aria-hidden="true" />
                  <p className="text-text-secondary mt-3 text-sm">
                    {localize('com_ui_no_skills_found')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}

export default SkillSelectDialog;
