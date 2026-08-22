import { useState, useMemo } from 'react';
import { Button, Clipboard, CheckMark, TooltipAnchor } from '@librechat/client';
import type { TMessage, SearchResultData } from 'librechat-data-provider';
import { useLocalize, useCopyToClipboard, hasCopyableText } from '~/hooks';
import { revealOnRowHoverClasses } from './styles';
import { cn } from '~/utils';

type THoverButtons = {
  message: TMessage;
  searchResults?: { [key: string]: SearchResultData };
};

export default function MinimalHoverButtons({ message, searchResults }: THoverButtons) {
  const localize = useLocalize();
  const [isCopied, setIsCopied] = useState(false);
  const copyToClipboard = useCopyToClipboard({
    text: message.text,
    content: message.content,
    searchResults,
  });
  const canCopy = useMemo(
    () => hasCopyableText({ text: message.text, content: message.content, searchResults }),
    [message.text, message.content, searchResults],
  );

  return (
    <div className="text-text-tertiary visible mt-1 flex justify-center gap-1 self-end lg:justify-start">
      <TooltipAnchor
        description={
          isCopied ? localize('com_ui_copied_to_clipboard') : localize('com_ui_copy_to_clipboard')
        }
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isCopied
                ? localize('com_ui_copied_to_clipboard')
                : localize('com_ui_copy_to_clipboard')
            }
            className={cn(
              'text-text-secondary-alt ml-0 flex size-auto items-center gap-1.5 rounded-lg p-1.5 text-xs',
              'hover:bg-surface-hover hover:text-text-primary',
              'focus-visible:ring-text-primary focus-visible:ring-2 focus-visible:outline-none',
              revealOnRowHoverClasses,
            )}
            disabled={!canCopy}
            onClick={() => copyToClipboard(setIsCopied)}
          >
            {isCopied ? (
              <CheckMark className="h-[19px] w-[19px]" />
            ) : (
              <Clipboard className="h-[19px] w-[19px]" />
            )}
          </Button>
        }
      />
    </div>
  );
}
