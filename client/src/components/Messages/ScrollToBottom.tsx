import { forwardRef } from 'react';
import { useRecoilValue } from 'recoil';
import { ChevronDown } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

type Props = {
  scrollHandler: React.MouseEventHandler<HTMLButtonElement>;
};

const ScrollToBottom = forwardRef<HTMLDivElement, Props>(({ scrollHandler }, ref) => {
  const localize = useLocalize();
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none absolute right-0 bottom-5 left-0 mx-auto flex justify-end',
        maximizeChatSpace ? 'max-w-full' : 'md:max-w-3xl xl:max-w-4xl',
      )}
    >
      <button
        onClick={scrollHandler}
        className="premium-scroll-button focus-visible:ring-border-xheavy pointer-events-auto cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
        aria-label={localize('com_ui_scroll_to_bottom')}
      >
        <ChevronDown className="text-text-secondary h-4 w-4" />
      </button>
    </div>
  );
});

ScrollToBottom.displayName = 'ScrollToBottom';

export default ScrollToBottom;
