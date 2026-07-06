import * as React from 'react';
import { X } from 'lucide-react';
import { JSX } from 'react/jsx-runtime';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '~/utils';

const DialogDepthContext = React.createContext(0);

/** Current OGDialog nesting depth (0 when rendered outside any dialog). */
export const useDialogDepth = (): number => React.useContext(DialogDepthContext);

/**
 * z-index for a portaled popover so it renders above the dialog it lives in.
 * Outside any dialog (depth 0) it falls back to a low default (50).
 */
export const usePopoverZIndex = (): number => {
  const depth = useDialogDepth();
  if (depth <= 0) {
    return 50;
  }
  const contentZIndex = 140 + (depth - 1) * 60;
  return contentZIndex + 10;
};

interface OGDialogProps extends DialogPrimitive.DialogProps {
  triggerRef?: React.RefObject<HTMLButtonElement | HTMLInputElement | HTMLDivElement | null>;
  triggerRefs?: React.RefObject<HTMLButtonElement | HTMLInputElement | HTMLDivElement | null>[];
}

const Dialog: React.ForwardRefExoticComponent<OGDialogProps & React.RefAttributes<HTMLDivElement>> =
  React.forwardRef<HTMLDivElement, OGDialogProps>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ children, triggerRef, triggerRefs, onOpenChange, ...props }, ref) => {
      const parentDepth = React.useContext(DialogDepthContext);
      const currentDepth = parentDepth + 1;

      const handleOpenChange = (open: boolean) => {
        if (!open && triggerRef?.current) {
          setTimeout(() => {
            triggerRef.current?.focus();
          }, 0);
        }
        if (triggerRefs?.length) {
          triggerRefs.forEach((ref) => {
            if (ref?.current) {
              setTimeout(() => {
                ref.current?.focus();
              }, 0);
            }
          });
        }
        onOpenChange?.(open);
      };

      return (
        <DialogDepthContext.Provider value={currentDepth}>
          <DialogPrimitive.Root {...props} onOpenChange={handleOpenChange}>
            {children}
          </DialogPrimitive.Root>
        </DialogDepthContext.Provider>
      );
    },
  );

const DialogTrigger: React.ForwardRefExoticComponent<
  DialogPrimitive.DialogTriggerProps & React.RefAttributes<HTMLButtonElement>
> = DialogPrimitive.Trigger;

const DialogPortal: React.FC<DialogPrimitive.DialogPortalProps> = DialogPrimitive.Portal;

const DialogClose: React.ForwardRefExoticComponent<
  DialogPrimitive.DialogCloseProps & React.RefAttributes<HTMLButtonElement>
> = DialogPrimitive.Close;

export const DialogOverlay: React.ForwardRefExoticComponent<
  Omit<DialogPrimitive.DialogOverlayProps & React.RefAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<HTMLDivElement>
> = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, style, ...props }, ref) => {
  const depth = React.useContext(DialogDepthContext);
  const overlayZIndex = 130 + (depth - 1) * 60;

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      style={{ ...style, zIndex: overlayZIndex }}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/80',
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  disableScroll?: boolean;
  overlayClassName?: string;
};

const DialogContent: React.ForwardRefExoticComponent<
  Omit<DialogPrimitive.DialogContentProps & React.RefAttributes<HTMLDivElement>, 'ref'> & {
    showCloseButton?: boolean;
    disableScroll?: boolean;
    overlayClassName?: string;
  } & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  (
    {
      className,
      overlayClassName,
      showCloseButton = true,
      children,
      style,
      onEscapeKeyDown: propsOnEscapeKeyDown,
      ...props
    },
    ref,
  ) => {
    const depth = React.useContext(DialogDepthContext);
    const contentZIndex = 140 + (depth - 1) * 60;

    /* Handle Escape key to prevent closing dialog if a tooltip or dropdown has focus
    (this is a workaround in order to achieve WCAG compliance which requires
    that our tooltips be dismissable with Escape key) */
    const handleEscapeKeyDown = React.useCallback(
      (event: KeyboardEvent) => {
        const activeElement = document.activeElement;

        // Check if active element is a trigger with an open popover (aria-expanded="true")
        if (activeElement?.getAttribute('aria-expanded') === 'true') {
          event.preventDefault();
          return;
        }

        // Check if a dropdown menu, listbox, or combobox has focus (focus is within it)
        const popoverElements = document.querySelectorAll(
          '[role="menu"], [role="listbox"], [role="combobox"]',
        );
        for (const popover of popoverElements) {
          if (popover.contains(activeElement)) {
            event.preventDefault();
            return;
          }
        }

        // Check if a tooltip has focus (focus is within it)
        const tooltips = document.querySelectorAll('.tooltip');
        for (const tooltip of tooltips) {
          if (tooltip.contains(activeElement)) {
            event.preventDefault();
            return;
          }
        }

        propsOnEscapeKeyDown?.(event);
      },
      [propsOnEscapeKeyDown],
    );

    return (
      <DialogPortal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          ref={ref}
          style={{ ...style, zIndex: contentZIndex }}
          onEscapeKeyDown={handleEscapeKeyDown}
          className={cn(
            'bg-background text-text-primary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] grid max-h-[90vh] w-full max-w-11/12 translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-2xl p-6 shadow-lg duration-200',
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="ring-ring-primary ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
              <X className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader: {
  ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
  displayName: string;
} = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter: {
  ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
  displayName: string;
} = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle: React.ForwardRefExoticComponent<
  Omit<DialogPrimitive.DialogTitleProps & React.RefAttributes<HTMLHeadingElement>, 'ref'> &
    React.RefAttributes<HTMLHeadingElement>
> = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription: React.ForwardRefExoticComponent<
  Omit<DialogPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, 'ref'> &
    React.RefAttributes<HTMLParagraphElement>
> = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-text-secondary text-sm', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog as OGDialog,
  DialogPortal as OGDialogPortal,
  DialogOverlay as OGDialogOverlay,
  DialogClose as OGDialogClose,
  DialogTrigger as OGDialogTrigger,
  DialogContent as OGDialogContent,
  DialogHeader as OGDialogHeader,
  DialogFooter as OGDialogFooter,
  DialogTitle as OGDialogTitle,
  DialogDescription as OGDialogDescription,
};
