import { useState } from 'react';
import type { TConversation, TMessage } from 'librechat-data-provider';
// import { Clipboard, CheckMark, EditIcon, RegenerateIcon, ContinueIcon } from '~/components/svg';
// import { useGenerationsByLatest, useLocalize } from '~/hooks';
import {
  Clipboard,
  CheckMark,
  EditIcon,
  RegenerateIcon,
  ContinueIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
} from '~/components/svg';
import { useGenerationsByLatest, useGenerations, useLocalize } from '~/hooks';
// import { Clipboard, CheckMark, EditIcon, RegenerateIcon, ContinueIcon } from '~/components/svg';
// import { useGenerationsByLatest, useLocalize } from '~/hooks';
import { Fork } from '~/components/Conversations';
import { cn } from '~/utils';

type THoverButtons = {
  showStopButton: boolean;
  isEditing: boolean;
  enterEdit: (cancel?: boolean) => void;
  copyToClipboard: (setIsCopied: React.Dispatch<React.SetStateAction<boolean>>) => void;
  conversation: TConversation | null;
  isSubmitting: boolean;
  message: TMessage;
  regenerate: () => void;
  handleContinue: (e: React.MouseEvent<HTMLButtonElement>) => void;
  latestMessage: TMessage | null;
  stopPlaybackMessage: (
    { isPaused, isStopped },
    setPlaybackStatus: React.Dispatch<
      React.SetStateAction<{ isPaused: boolean; isStopped: boolean }>
    >,
  ) => void;
  playbackMessage: (
    { isPaused, isStopped },
    setPlaybackStatus: React.Dispatch<
      React.SetStateAction<{ isPaused: boolean; isStopped: boolean }>
    >,
  ) => void;
  isLast: boolean;
};

export default function HoverButtons({
  showStopButton,
  isEditing,
  enterEdit,
  copyToClipboard,
  conversation,
  isSubmitting,
  message,
  regenerate,
  handleContinue,
  latestMessage,
  stopPlaybackMessage,
  playbackMessage,
  isLast,
}: THoverButtons) {
  const localize = useLocalize();
  const { endpoint: _endpoint, endpointType } = conversation ?? {};
  const endpoint = endpointType ?? _endpoint;
  const [isCopied, setIsCopied] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState({ isPaused: false, isStopped: true });
  const {
    hideEditButton,
    regenerateEnabled,
    continueSupported,
    forkingSupported,
    isEditableEndpoint,
  } = useGenerationsByLatest({
    isEditing,
    isSubmitting,
    message,
    endpoint: endpoint ?? '',
    latestMessage,
  });
  if (!conversation) {
    return null;
  }

  const { isCreatedByUser } = message;

  const onEdit = () => {
    if (isEditing) {
      return enterEdit(true);
    }
    enterEdit();
  };

  return (
    <div className="visible mt-0 flex justify-center gap-1 self-end text-gray-400 lg:justify-start">
      <button
        // className="hover-button active rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
        className={cn(
          'hover-button active rounded-md p-1 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible ',
          'data-[state=open]:active data-[state=open]:bg-gray-200 data-[state=open]:text-gray-700 data-[state=open]:dark:bg-gray-700 data-[state=open]:dark:text-gray-200',
          !isLast ? 'data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100' : '',
        )}
        onClick={() => playbackMessage(playbackStatus, setPlaybackStatus)}
        type="button"
        title={
          playbackStatus.isPaused || playbackStatus.isStopped
            ? localize('com_msg_playback')
            : localize('com_msg_playback_pause')
        }
      >
        {(playbackStatus.isStopped && !playbackStatus.isPaused) ||
        (!playbackStatus.isStopped && playbackStatus.isPaused) ||
        (playbackStatus.isStopped && !playbackStatus.isPaused) ? (
            <PlayIcon />
          ) : (
            <PauseIcon />
          )}
      </button>
      {showStopButton ? (
        <button
          className="hover-button active rounded-md p-1 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible"
          onClick={() => stopPlaybackMessage(playbackStatus, setPlaybackStatus)}
          type="button"
          disabled={playbackStatus.isStopped}
          title={localize('com_msg_playback_stop')}
        >
          <StopIcon />
        </button>
      ) : null}
      {isEditableEndpoint && (
        <button
          className={cn(
            'hover-button rounded-md p-1 text-gray-400 hover:text-gray-900 dark:text-gray-400/70 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
            isCreatedByUser ? '' : 'active',
            hideEditButton ? 'opacity-0' : '',
            isEditing ? 'active bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' : '',
            !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          )}
          onClick={onEdit}
          type="button"
          title={localize('com_ui_edit')}
          disabled={hideEditButton}
        >
          <EditIcon />
        </button>
      )}
      <button
        className={cn(
          'ml-0 flex items-center gap-1.5 rounded-md p-1 text-xs hover:text-gray-900 dark:text-gray-400/70 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
          isSubmitting && isCreatedByUser ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
        )}
        onClick={() => copyToClipboard(setIsCopied)}
        type="button"
        title={
          isCopied ? localize('com_ui_copied_to_clipboard') : localize('com_ui_copy_to_clipboard')
        }
      >
        {isCopied ? <CheckMark className="h-[18px] w-[18px]" /> : <Clipboard />}
      </button>
      {regenerateEnabled ? (
        <button
          className={cn(
            'hover-button active rounded-md p-1 text-gray-400 hover:text-gray-900 dark:text-gray-400/70 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible md:group-[.final-completion]:visible',
            !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          )}
          onClick={regenerate}
          type="button"
          title={localize('com_ui_regenerate')}
        >
          <RegenerateIcon className="hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400" />
        </button>
      ) : null}
      {continueSupported ? (
        <button
          className={cn(
            'hover-button active rounded-md p-1 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible ',
            !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          )}
          onClick={handleContinue}
          type="button"
          title={localize('com_ui_continue')}
        >
          <ContinueIcon className="h-4 w-4 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400" />
        </button>
      ) : null}
      <Fork
        isLast={isLast}
        messageId={message.messageId}
        conversationId={conversation.conversationId}
        forkingSupported={forkingSupported}
        latestMessage={latestMessage}
      />
    </div>
  );
}
