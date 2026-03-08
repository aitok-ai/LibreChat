import { useState, useMemo, memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PermissionBits, ResourceType } from 'librechat-data-provider';
import { Menu as MenuIcon, Edit as EditIcon, EarthIcon, TextSearch } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@librechat/client';
import type { TPromptGroup } from 'librechat-data-provider';
import { useLocalize, useSubmitMessage, useResourcePermissions } from '~/hooks';
import VariableDialog from '~/components/Prompts/Groups/VariableDialog';
import PreviewPrompt from '~/components/Prompts/PreviewPrompt';
import ListCard from '~/components/Prompts/Groups/ListCard';
import { detectVariables } from '~/utils';

function ChatGroupItem({
  group,
  instanceProjectId,
}: {
  group: TPromptGroup;
  instanceProjectId?: string;
}) {
  const localize = useLocalize();
  const { submitPrompt } = useSubmitMessage();
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isVariableDialogOpen, setVariableDialogOpen] = useState(false);

  const groupIsGlobal = useMemo(
    () => instanceProjectId != null && group.projectIds?.includes(instanceProjectId),
    [group, instanceProjectId],
  );

  // Check permissions for the promptGroup
  const { hasPermission } = useResourcePermissions(ResourceType.PROMPTGROUP, group._id || '');
  const canEdit = hasPermission(PermissionBits.EDIT);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const onCardClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    const text = group.productionPrompt?.prompt;
    if (!text?.trim()) {
      return;
    }

    if (detectVariables(text)) {
      setVariableDialogOpen(true);
      return;
    }

    submitPrompt(text);
  };

  return (
    <>
      <div className="border-border-light hover:bg-surface-tertiary relative my-2 items-stretch justify-between rounded-xl border px-1 shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg">
        <ListCard
          name={group.name}
          category={group.category ?? ''}
          onClick={onCardClick}
          snippet={
            typeof group.oneliner === 'string' && group.oneliner.length > 0
              ? group.oneliner
              : (group.productionPrompt?.prompt ?? '')
          }
        ></ListCard>
        {groupIsGlobal === true && (
          <div className="absolute top-[16px] right-14">
            <EarthIcon
              className="icon-md text-green-400"
              aria-label={localize('com_ui_sr_global_prompt')}
            />
          </div>
        )}
        <div className="absolute top-0 right-0 mt-2.5 mr-1 items-start pl-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                ref={triggerButtonRef}
                id={`prompt-actions-${group._id}`}
                type="button"
                aria-label={localize('com_ui_sr_actions_menu', { 0: group.name })}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                className="border-border-medium hover:border-border-heavy hover:bg-surface-hover focus:border-border-heavy z-50 mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-transparent p-0 text-sm font-medium transition-all duration-300 ease-in-out focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <MenuIcon className="icon-md text-text-secondary" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              id={`prompt-menu-${group._id}`}
              aria-label={`Available actions for ${group.name}`}
              className="z-50 w-fit rounded-xl"
              collisionPadding={2}
              align="start"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewDialogOpen(true);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                className="text-text-primary hover:bg-surface-hover focus:bg-surface-hover w-full cursor-pointer rounded-lg disabled:cursor-not-allowed"
              >
                <TextSearch className="text-text-primary mr-2 h-4 w-4" aria-hidden="true" />
                <span>{localize('com_ui_preview')}</span>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={!canEdit}
                    className="text-text-primary hover:bg-surface-hover focus:bg-surface-hover cursor-pointer rounded-lg disabled:cursor-not-allowed"
                    asChild
                  >
                    <Link to={`/d/prompts/${group._id}`}>
                      <EditIcon className="text-text-primary mr-2 h-4 w-4" aria-hidden="true" />
                      <span>{localize('com_ui_edit')}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <PreviewPrompt
        group={group}
        open={isPreviewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onCloseAutoFocus={() => {
          requestAnimationFrame(() => {
            triggerButtonRef.current?.focus({ preventScroll: true });
          });
        }}
      />
      <VariableDialog
        open={isVariableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        group={group}
      />
    </>
  );
}

export default memo(ChatGroupItem);
