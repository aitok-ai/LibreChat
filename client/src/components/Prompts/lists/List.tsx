import { FileText } from 'lucide-react';
import type { TPromptGroup } from 'librechat-data-provider';
import ChatGroupItem from './ChatGroupItem';
import { useLocalize } from '~/hooks';

export default function List({
  groups = [],
  isChatRoute,
}: {
  groups?: TPromptGroup[];
  isChatRoute?: boolean;
}) {
  const localize = useLocalize();

  const renderContent = () => {
    if (groups.length === 0) {
      return (
        <div className="border-border-medium my-2 flex flex-col items-center justify-center rounded-lg border bg-transparent p-6 text-center">
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
      );
    }

    return groups.map((group) => (
      <ChatGroupItem key={group._id} group={group} isChatRoute={isChatRoute} />
    ));
  };

  return (
    <section className="flex-grow" aria-label={localize('com_ui_prompt_groups')}>
      <div>{renderContent()}</div>
    </section>
  );
}
