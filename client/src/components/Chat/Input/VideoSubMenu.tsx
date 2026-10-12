import React, { memo } from 'react';
import { useRecoilState } from 'recoil';
import * as Ariakit from '@ariakit/react';
import { PinIcon } from '@librechat/client';
import { Constants } from 'librechat-data-provider';
import { Check, ChevronRight, Video as VideoIcon } from 'lucide-react';
import { VIDEO_PRESET_OPTIONS, VIDEO_TEMPLATE_OPTIONS } from './videoOptions';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

/**
 * The video menu body, shared by the palette row and the chip it pins. Both
 * menus read the same per-conversation state, so toggling video from either one
 * moves the other, and neither keeps a copy of the settings.
 */
export function VideoOptionsMenu() {
  const localize = useLocalize();
  const context = useBadgeRowContext();
  const convoKey = context?.conversationId ?? Constants.NEW_CONVO;
  const [videoMode, setVideoMode] = useRecoilState(store.videoModeByConvoId(convoKey));
  const [videoTemplate, setVideoTemplate] = useRecoilState(store.videoTemplateByConvoId(convoKey));
  const [videoPreset, setVideoPreset] = useRecoilState(store.videoPresetByConvoId(convoKey));

  return (
    <>
      <Ariakit.MenuItemCheckbox
        hideOnClick={false}
        name="video-mode"
        value="enabled"
        checked={videoMode}
        onChange={() => setVideoMode(!videoMode)}
        className={cn(
          'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2',
          'transition-all duration-150 outline-none',
          'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
          videoMode && 'bg-surface-active-alt',
        )}
      >
        <div className="bg-surface-tertiary flex h-8 w-8 items-center justify-center rounded-lg">
          <VideoIcon className="text-text-secondary h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-text-primary truncate text-sm font-medium">
            {localize('com_ui_video_enable')}
          </span>
          <p className="text-text-secondary truncate text-xs">
            {localize('com_ui_video_enable_desc')}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border',
            videoMode
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border-xheavy bg-transparent',
          )}
        >
          {videoMode && <Check className="h-4 w-4" />}
        </span>
      </Ariakit.MenuItemCheckbox>

      <div className="bg-border-light my-1 h-px" />

      <div className="text-text-secondary px-2.5 pt-1 pb-1 text-xs font-medium">
        {localize('com_ui_video_template')}
      </div>
      {VIDEO_TEMPLATE_OPTIONS.map((option) => {
        const selected = option.value === videoTemplate;
        return (
          <Ariakit.MenuItem
            key={option.value}
            hideOnClick={false}
            onClick={() => setVideoTemplate(option.value as typeof videoTemplate)}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2',
              'transition-all duration-150 outline-none',
              'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
              selected && 'bg-surface-active-alt',
            )}
          >
            <span className="text-text-primary truncate text-sm">
              {localize(option.labelKey as Parameters<typeof localize>[0])}
            </span>
            {selected && <Check className="text-text-secondary h-4 w-4" />}
          </Ariakit.MenuItem>
        );
      })}

      <div className="bg-border-light my-1 h-px" />

      <div className="text-text-secondary px-2.5 pt-1 pb-1 text-xs font-medium">
        {localize('com_ui_video_platform')}
      </div>
      {VIDEO_PRESET_OPTIONS.map((option) => {
        const selected = option.value === videoPreset;
        return (
          <Ariakit.MenuItem
            key={option.value}
            hideOnClick={false}
            onClick={() => setVideoPreset(option.value as typeof videoPreset)}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2',
              'transition-all duration-150 outline-none',
              'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
              selected && 'bg-surface-active-alt',
            )}
          >
            <span className="text-text-primary truncate text-sm">
              {localize(option.labelKey as Parameters<typeof localize>[0])}
            </span>
            {selected && <Check className="text-text-secondary h-4 w-4" />}
          </Ariakit.MenuItem>
        );
      })}
    </>
  );
}

const VideoSubMenu = React.forwardRef<HTMLDivElement>((props, ref) => {
  const localize = useLocalize();
  const context = useBadgeRowContext();

  const convoKey = context?.conversationId ?? Constants.NEW_CONVO;
  const [videoMode, setVideoMode] = useRecoilState(store.videoModeByConvoId(convoKey));

  const menuStore = Ariakit.useMenuStore({
    focusLoop: true,
    showTimeout: 100,
    placement: 'right',
  });

  if (!context) {
    return null;
  }

  return (
    <div ref={ref}>
      <Ariakit.MenuProvider store={menuStore}>
        <Ariakit.MenuButton
          {...props}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            /* The footer row is not a menu item, so a MenuItem would trip
               Ariakit's invariant. MenuButton discloses the shared store by
               itself; only the click needs to stop reaching the palette. */
            e.stopPropagation();
          }}
          className="hover:bg-surface-hover flex w-full cursor-pointer items-center justify-between rounded-lg p-2"
        >
          <div className="flex items-center gap-2">
            <VideoIcon className="text-text-primary h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span>{localize('com_ui_video')}</span>
            <ChevronRight className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          </div>
          {/* Pinning turns video mode on, which is what drops a chip onto the
              composer the way an MCP row does; the chip's menu is where it is
              switched off again. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVideoMode(!videoMode);
            }}
            className={cn(
              'rounded p-1 transition-all duration-200',
              'hover:bg-surface-tertiary hover:shadow-sm',
              !videoMode && 'text-text-secondary hover:text-text-primary',
            )}
            aria-label={videoMode ? localize('com_ui_unpin') : localize('com_ui_pin')}
          >
            <div className="h-4 w-4">
              <PinIcon unpin={videoMode} />
            </div>
          </button>
        </Ariakit.MenuButton>

        <Ariakit.Menu
          portal={true}
          unmountOnHide={true}
          aria-label={localize('com_ui_video')}
          className={cn(
            'animate-popover-left z-40 ml-3 flex max-w-[320px] min-w-[260px] flex-col rounded-xl',
            'border-border-light bg-presentation border p-1.5 shadow-lg',
          )}
        >
          <VideoOptionsMenu />
        </Ariakit.Menu>
      </Ariakit.MenuProvider>
    </div>
  );
});

/**
 * The chip pinned onto the composer by the palette row. Clicking it opens the
 * same menu the row does instead of unpinning: switching video off in there is
 * what removes the chip, so there is one switch to reason about.
 */
export function VideoChip() {
  const localize = useLocalize();
  const menuStore = Ariakit.useMenuStore({
    focusLoop: true,
    showTimeout: 100,
    placement: 'top-start',
  });

  return (
    <Ariakit.MenuProvider store={menuStore}>
      <Ariakit.MenuButton
        aria-label={localize('com_ui_select_var', { 0: localize('com_ui_video') })}
        className="rounded-theme-control border-border-chrome bg-surface-secondary h-theme-control px-theme-control-x text-text-secondary duration-theme-fast hover:bg-surface-hover inline-flex max-w-full items-center gap-1 border text-xs font-medium transition-colors"
      >
        <VideoIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>{localize('com_ui_video')}</span>
      </Ariakit.MenuButton>

      <Ariakit.Menu
        portal={true}
        unmountOnHide={true}
        aria-label={localize('com_ui_video')}
        className={cn(
          'animate-popover-left z-40 flex max-w-[320px] min-w-[260px] flex-col rounded-xl',
          'border-border-light bg-presentation border p-1.5 shadow-lg',
        )}
      >
        <VideoOptionsMenu />
      </Ariakit.Menu>
    </Ariakit.MenuProvider>
  );
}

export default memo(VideoSubMenu);
