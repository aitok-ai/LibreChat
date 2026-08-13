import * as React from 'react';
import { cn } from '~/utils';
import './Field.css';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>> =
  React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          'lc-field border-border-light text-text-primary ring-offset-surface-primary placeholder:text-text-secondary focus-visible:border-border-medium focus-visible:ring-text-primary flex h-10 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className ?? '',
        )}
        ref={ref}
        {...props}
      />
    );
  });

Input.displayName = 'Input';

export { Input };
