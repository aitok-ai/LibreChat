import {
  Switch,
  HoverCard,
  CircleHelpIcon,
  HoverCardPortal,
  HoverCardContent,
  HoverCardTrigger,
} from '@librechat/client';
import type { ReactNode } from 'react';
import { useLocalize } from '~/hooks';
import { ESide } from '~/common';

export const sectionLabelClass =
  'text-[11px] font-medium uppercase tracking-wide text-text-secondary';

/** Prominent heading for a top-level settings group (Essentials, Orchestration). */
export const groupHeadingClass = 'text-sm font-semibold text-text-primary';

/** Small count chip, e.g. "2 / 10". */
export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="bg-surface-tertiary text-text-secondary inline-flex h-4 items-center justify-center rounded-full px-1.5 text-[10px] font-medium whitespace-nowrap tabular-nums">
      {children}
    </span>
  );
}

/** "Beta" accent pill. */
export function BetaPill() {
  const localize = useLocalize();
  return (
    <span className="rounded-full border border-purple-600/40 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-purple-700 uppercase dark:text-purple-400">
      {localize('com_ui_beta')}
    </span>
  );
}

/**
 * Focusable help trigger for an info HoverCard. Must be rendered inside a
 * `HoverCard` so the popover opens on hover or keyboard focus.
 */
export function InfoTrigger() {
  const localize = useLocalize();
  return (
    <HoverCardTrigger asChild>
      <button
        type="button"
        aria-label={localize('com_ui_more_info')}
        className="text-text-tertiary hover:text-text-secondary focus-visible:ring-ring-primary flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2"
      >
        <CircleHelpIcon className="h-3.5 w-3.5" aria-hidden={true} />
      </button>
    </HoverCardTrigger>
  );
}

interface ToggleSettingProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  /** Optional explanation shown in a `?` popover next to the label. */
  info?: ReactNode;
}

/**
 * A subordinate on/off setting: a small secondary label, an optional info
 * popover, and a switch on the right. Sits below a pattern title without
 * competing with it for visual weight.
 */
export function ToggleSetting({ id, label, checked, onCheckedChange, info }: ToggleSettingProps) {
  const row = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <label htmlFor={id} className="text-text-primary truncate text-[13px] font-medium">
          {label}
        </label>
        {info != null && <InfoTrigger />}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );

  if (info == null) {
    return row;
  }

  return (
    <HoverCard openDelay={50}>
      {row}
      <HoverCardPortal>
        <HoverCardContent side={ESide.Top} className="w-80">
          <div className="text-text-secondary space-y-2 text-sm">{info}</div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}
