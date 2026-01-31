import * as Ariakit from '@ariakit/react';
import { ChevronDown, Video as VideoIcon, Check } from 'lucide-react';
import { useMemo } from 'react';
import { TooltipAnchor } from '@librechat/client';
import { Constants, downloadVideoJobZip } from 'librechat-data-provider';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';
import { VIDEO_PRESET_OPTIONS, VIDEO_TEMPLATE_OPTIONS } from './videoOptions';

export default function VideoSelect() {
  const { conversationId } = useBadgeRowContext();
  const localize = useLocalize();
  const convoKey = conversationId ?? Constants.NEW_CONVO;

  const [videoMode, setVideoMode] = useRecoilState(store.videoModeByConvoId(convoKey));
  const [videoTemplate, setVideoTemplate] = useRecoilState(store.videoTemplateByConvoId(convoKey));
  const [videoPreset, setVideoPreset] = useRecoilState(store.videoPresetByConvoId(convoKey));
  const jobState = useRecoilValue(store.videoJobUIStateByConvoId(convoKey));

  const { videoMenuStore } = useBadgeRowContext();
  const fallbackMenuStore = Ariakit.useMenuStore({ focusLoop: true });
  const menuStore = videoMenuStore ?? fallbackMenuStore;
  const isOpen = menuStore.useState('open');

  const displayText = useMemo(() => {
    if (!videoMode) {
      return null;
    }
    const templateLabel = VIDEO_TEMPLATE_OPTIONS.find((t) => t.value === videoTemplate)?.labelKey;
    const presetLabel = VIDEO_PRESET_OPTIONS.find((p) => p.value === videoPreset)?.labelKey;
    if (!templateLabel && !presetLabel) {
      return localize('com_ui_video');
    }
    return [templateLabel, presetLabel]
      .filter(Boolean)
      .map((key) => localize(key as Parameters<typeof localize>[0]))
      .join(' · ');
  }, [localize, videoMode, videoTemplate, videoPreset]);

  const description = useMemo(() => {
    if (!videoMode) {
      return localize('com_ui_video_enable_hint');
    }
    return displayText ?? localize('com_ui_video');
  }, [displayText, localize, videoMode]);

  return (
    <Ariakit.MenuProvider store={menuStore}>
      <TooltipAnchor
        description={description}
        disabled={isOpen}
        render={
          <Ariakit.MenuButton
            className={cn(
              'group relative inline-flex items-center justify-center gap-1.5',
              'border border-border-medium text-sm font-medium transition-all',
              'h-9 min-w-9 rounded-full bg-transparent px-2.5 shadow-sm',
              'hover:bg-surface-hover hover:shadow-md active:shadow-inner',
              'md:w-fit md:justify-start md:px-3',
              isOpen && 'bg-surface-hover',
              videoMode && 'border-purple-500/70',
            )}
          />
        }
      >
        <VideoIcon
          className={cn('h-4 w-4', videoMode ? 'text-purple-600' : 'text-text-secondary')}
        />
        <span className="hidden truncate text-text-primary md:block">
          {displayText ?? localize('com_ui_video')}
        </span>
        <ChevronDown
          className={cn(
            'hidden h-3 w-3 text-text-secondary transition-transform md:block',
            isOpen && 'rotate-180',
          )}
        />
      </TooltipAnchor>

      <Ariakit.Menu
        portal={true}
        gutter={8}
        aria-label={localize('com_ui_video')}
        className={cn(
          'z-50 flex min-w-[260px] max-w-[320px] flex-col rounded-xl',
          'border border-border-light bg-presentation p-1.5 shadow-lg',
          'origin-top opacity-0 transition-[opacity,transform] duration-200 ease-out',
          'data-[enter]:scale-100 data-[enter]:opacity-100',
          'scale-95 data-[leave]:scale-95 data-[leave]:opacity-0',
        )}
      >
        <Ariakit.MenuItemCheckbox
          hideOnClick={false}
          name="video-mode"
          value="enabled"
          checked={videoMode}
          onChange={() => setVideoMode(!videoMode)}
          className={cn(
            'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2',
            'outline-none transition-all duration-150',
            'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
            videoMode && 'bg-surface-active-alt',
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-tertiary">
            <VideoIcon className="h-5 w-5 text-text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="truncate text-sm font-medium text-text-primary">
              {localize('com_ui_video_enable')}
            </span>
            <p className="truncate text-xs text-text-secondary">
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

        <div className="my-1 h-px bg-border-light" />

        <div className="px-2.5 pb-1 pt-1 text-xs font-medium text-text-secondary">
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
                'outline-none transition-all duration-150',
                'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
                selected && 'bg-surface-active-alt',
              )}
            >
              <span className="truncate text-sm text-text-primary">
                {localize(option.labelKey as Parameters<typeof localize>[0])}
              </span>
              {selected && <Check className="h-4 w-4 text-text-secondary" />}
            </Ariakit.MenuItem>
          );
        })}

        <div className="my-1 h-px bg-border-light" />

        <div className="px-2.5 pb-1 pt-1 text-xs font-medium text-text-secondary">
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
                'outline-none transition-all duration-150',
                'hover:bg-surface-hover data-[active-item]:bg-surface-hover',
                selected && 'bg-surface-active-alt',
              )}
            >
              <span className="truncate text-sm text-text-primary">
                {localize(option.labelKey as Parameters<typeof localize>[0])}
              </span>
              {selected && <Check className="h-4 w-4 text-text-secondary" />}
            </Ariakit.MenuItem>
          );
        })}

        {jobState.jobId && jobState.step === 'package' && jobState.stepStatus === 'completed' && (
          <>
            <div className="my-1 h-px bg-border-light" />
            <div className="px-2.5 py-2 text-xs text-text-secondary">
              <a
                href={downloadVideoJobZip(jobState.jobId)}
                className="text-blue-500 hover:underline"
              >
                {localize('com_ui_video_download_zip')}
              </a>
            </div>
          </>
        )}
      </Ariakit.Menu>
    </Ariakit.MenuProvider>
  );
}
