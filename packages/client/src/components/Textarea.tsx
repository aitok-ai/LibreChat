/* eslint-disable */
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '~/utils';
import './Field.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.ForwardRefExoticComponent<
  TextareaProps & React.RefAttributes<HTMLTextAreaElement>
> = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'lc-field border-border-light bg-surface-secondary text-text-primary placeholder:text-text-secondary focus-visible:border-border-medium focus-visible:ring-text-primary flex min-h-20 w-full resize-none rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
