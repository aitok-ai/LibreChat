import { FileText } from 'lucide-react';
import { Skeleton } from '@librechat/client';
import type { TPromptGroup } from 'librechat-data-provider';
import DashGroupItem from './DashGroupItem';
import ChatGroupItem from './ChatGroupItem';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function List({
  groups = [],
  isChatRoute,
  isLoading,
}: {
  groups?: TPromptGroup[];
  isChatRoute: boolean;
  isLoading: boolean;
}) {
  const localize = useLocalize();

  return (
    <div className="flex h-full flex-col">
      <section className="flex-grow overflow-y-auto" aria-label={localize('com_ui_prompt_groups')}>
        <div className="overflow-x-hidden overflow-y-auto">
          {isLoading && isChatRoute && (
            <Skeleton className="my-2 flex h-[84px] w-full rounded-2xl border-0 px-3 pt-3 pb-4" />
          )}
          {isLoading && !isChatRoute && (
            <div className="space-y-2 px-2">
              {Array.from({ length: 10 }).map((_, index: number) => (
                <Skeleton key={index} className="flex h-14 w-full rounded-lg border-0 p-4" />
              ))}
            </div>
          )}
          {!isLoading && groups.length === 0 && (
            <div
              className={cn(
                'border-border-light flex flex-col items-center justify-center rounded-lg border bg-transparent p-6 text-center',
                isChatRoute ? 'my-2' : 'mx-2 my-4',
              )}
            >
              <div className="bg-surface-tertiary mb-2 flex size-10 items-center justify-center rounded-full">
                <FileText className="text-text-secondary size-5" aria-hidden="true" />
              </div>
              <p className="text-text-primary text-sm font-medium">
                {localize('com_ui_no_prompts_title')}
              </p>
              <p className="text-text-secondary mt-0.5 text-xs">
                {localize('com_ui_add_first_prompt')}
              </p>
            </div>
          )}
          {isChatRoute ? (
            groups.map((group) => <ChatGroupItem key={group._id} group={group} />)
          ) : (
            <div className="space-y-2 px-0 md:px-2">
              {groups.map((group) => (
                <DashGroupItem key={group._id} group={group} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
