import { cn } from '~/utils';

export const QuestionMark = ({ className = '' }) => {
  return (
    <span>
      <div
        className={cn(
          'border-token-border-medium text-token-text-tertiary ml-2 flex h-3.5 w-3.5 cursor-default items-center justify-center rounded-full border text-[0.5rem] leading-none font-medium',
          className,
        )}
      >
        ?
      </div>
    </span>
  );
};
