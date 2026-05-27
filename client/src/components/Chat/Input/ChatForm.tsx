import { memo, useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import * as Ariakit from '@ariakit/react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  TextareaAutosize,
  TooltipAnchor,
  useToastContext,
} from '@librechat/client';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  Constants,
  apiBaseUrl,
  isAssistantsEndpoint,
  isAgentsEndpoint,
} from 'librechat-data-provider';
import type { TConversation } from 'librechat-data-provider';
import type { ExtendedFile, FileSetter, ConvoGenerator } from '~/common';
import {
  useChatContext,
  useChatFormContext,
  useAddedChatContext,
  useAssistantsMapContext,
} from '~/Providers';
import {
  useTextarea,
  useAutoSave,
  useLocalize,
  useRequiresKey,
  useHandleKeyUp,
  useQueryParams,
  useSubmitMessage,
  useFocusChatEffect,
} from '~/hooks';
import { useCreateVideoJobMutation } from '~/data-provider';
import PendingManualSkillsChips from './PendingManualSkillsChips';
import { cn, getModelSpec, removeFocusRings } from '~/utils';
import { useGetStartupConfig } from '~/data-provider';
import { mainTextareaId, BadgeItem } from '~/common';
import AttachFileChat from './Files/AttachFileChat';
import FileFormChat from './Files/FileFormChat';
import TextareaHeader from './TextareaHeader';
import SkillsCommand from './SkillsCommand';
import PromptsCommand from './PromptsCommand';
import AudioRecorder from './AudioRecorder';
import CollapseChat from './CollapseChat';
import StreamAudio from './StreamAudio';
import StopButton from './StopButton';
import SendButton from './SendButton';
import EditBadges from './EditBadges';
import BadgeRow from './BadgeRow';

type MenuStore = ReturnType<typeof Ariakit.useMenuStore>;
import Mention from './Mention';
import store from '~/store';

interface ChatFormProps {
  index: number;
  /** From ChatContext — individual values so memo can compare them */
  files: Map<string, ExtendedFile>;
  setFiles: FileSetter;
  conversation: TConversation | null;
  isSubmitting: boolean;
  filesLoading: boolean;
  setFilesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  newConversation: ConvoGenerator;
  handleStopGenerating: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ChatForm = memo(function ChatForm({
  index,
  files,
  setFiles,
  conversation,
  isSubmitting,
  filesLoading,
  setFilesLoading,
  newConversation,
  handleStopGenerating,
}: ChatFormProps) {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useFocusChatEffect(textAreaRef);
  const localize = useLocalize();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setIsScrollable] = useState(false);
  const [visualRowCount, setVisualRowCount] = useState(1);
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  const [backupBadges, setBackupBadges] = useState<Pick<BadgeItem, 'id'>[]>([]);

  const SpeechToText = useRecoilValue(store.speechToText);
  const TextToSpeech = useRecoilValue(store.textToSpeech);
  const chatDirection = useRecoilValue(store.chatDirection);
  const automaticPlayback = useRecoilValue(store.automaticPlayback);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);
  const isTemporary = useRecoilValue(store.isTemporary);

  const [badges, setBadges] = useRecoilState(store.chatBadges);
  const [isEditingBadges, setIsEditingBadges] = useRecoilState(store.isEditingBadges);
  const [showStopButton, setShowStopButton] = useRecoilState(store.showStopButtonByIndex(index));
  const [text, setText] = useRecoilState(store.textByIndex(index)); // 从Recoil获取到text状态
  const [showPlusPopover, setShowPlusPopover] = useRecoilState(store.showPlusPopoverFamily(index));
  const [showMentionPopover, setShowMentionPopover] = useRecoilState(
    store.showMentionPopoverFamily(index),
  );
  const plusPopoverAtom = useMemo(() => store.showPlusPopoverFamily(index), [index]);
  const mentionPopoverAtom = useMemo(() => store.showMentionPopoverFamily(index), [index]);

  const { requiresKey } = useRequiresKey();
  const methods = useChatFormContext();
  const {
    generateConversation,
    conversation: addedConvo,
    setConversation: setAddedConvo,
  } = useAddedChatContext();
  const assistantMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();

  const endpoint = useMemo(
    () => conversation?.endpointType ?? conversation?.endpoint,
    [conversation?.endpointType, conversation?.endpoint],
  );
  const modelSpec = useMemo(
    () => getModelSpec({ specName: conversation?.spec, startupConfig }),
    [conversation?.spec, startupConfig],
  );
  const hideBadgeRow = modelSpec?.hideBadgeRow === true;
  const conversationId = useMemo(
    () => conversation?.conversationId ?? Constants.NEW_CONVO,
    [conversation?.conversationId],
  );

  const convoKey = conversationId ?? Constants.NEW_CONVO;
  const videoMode = useRecoilValue(store.videoModeByConvoId(convoKey));
  const videoTemplate = useRecoilValue(store.videoTemplateByConvoId(convoKey));
  const videoPreset = useRecoilValue(store.videoPresetByConvoId(convoKey));
  const [videoJobUIState, setVideoJobUIState] = useRecoilState(
    store.videoJobUIStateByConvoId(convoKey),
  );
  const { showToast } = useToastContext();
  const [videoNotice, setVideoNotice] = useState<{
    message: string;
    tone: 'info' | 'error';
  } | null>(null);
  const videoNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedVideoFilesRef = useRef<Set<string>>(new Set());
  const [showVideoJobIndicator, setShowVideoJobIndicator] = useState(false);
  const videoJobIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDisconnectToastRef = useRef(0);
  const badgeMenuStoresRef = useRef<{ mcpMenuStore?: MenuStore; videoMenuStore?: MenuStore }>({});
  const handleBadgeMenuStores = useCallback(
    (stores: { mcpMenuStore: MenuStore; videoMenuStore: MenuStore }) => {
      badgeMenuStoresRef.current = stores;
    },
    [],
  );

  const isRTL = useMemo(
    () => (chatDirection != null ? chatDirection?.toLowerCase() === 'rtl' : false),
    [chatDirection],
  );
  const invalidAssistant = useMemo(
    () =>
      isAssistantsEndpoint(endpoint) &&
      (!(conversation?.assistant_id ?? '') ||
        !assistantMap?.[endpoint ?? '']?.[conversation?.assistant_id ?? '']),
    [conversation?.assistant_id, endpoint, assistantMap],
  );
  const disableInputs = useMemo(
    () => requiresKey || invalidAssistant,
    [requiresKey, invalidAssistant],
  );

  const handleContainerClick = useCallback((event?: React.MouseEvent<HTMLDivElement>) => {
    /** Check if the device is a touchscreen */
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      return;
    }
    const target = event?.target as HTMLElement | null;
    if (target?.closest('[data-chat-input-controls]')) {
      return;
    }
    textAreaRef.current?.focus();
  }, []);

  const handleFocusOrClick = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    badgeMenuStoresRef.current.mcpMenuStore?.setOpen(false);
    badgeMenuStoresRef.current.videoMenuStore?.setOpen(false);
  }, [isCollapsed]);

  const handleTextareaFocus = useCallback(() => {
    handleFocusOrClick();
    setIsTextAreaFocused(true);
  }, [handleFocusOrClick]);

  const handleTextareaBlur = useCallback(() => {
    setIsTextAreaFocused(false);
  }, []);

  useAutoSave({
    files,
    setFiles,
    textAreaRef,
    conversationId,
    isSubmitting,
  });

  const { submitMessage, submitPrompt } = useSubmitMessage();

  const createVideoJobMutation = useCreateVideoJobMutation();
  const [videoSubmitting, setVideoSubmitting] = useState(false);

  const handleKeyUp = useHandleKeyUp({
    index,
    textAreaRef,
  });
  const {
    isNotAppendable,
    handlePaste,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
  } = useTextarea({
    textAreaRef,
    submitButtonRef,
    setIsScrollable,
    disabled: disableInputs,
  });

  useQueryParams({ textAreaRef });

  const { ref, ...registerProps } = methods.register('text', {
    required: true,
    onChange: useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        methods.setValue('text', e.target.value, { shouldValidate: true }),
      [methods],
    ),
  });

  const textValue = useWatch({ control: methods.control, name: 'text' });

  const handleVideoSubmit = useCallback(async () => {
    if (videoSubmitting) {
      return;
    }
    const assetFiles = Array.from(files.values());
    const incomplete = assetFiles.find((file) => (file.progress ?? 0) < 1);
    if (assetFiles.length === 0) {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: localize('com_ui_video_assets_required'),
      }));
      return;
    }
    if (incomplete) {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: localize('com_ui_video_uploading_assets'),
      }));
      return;
    }
    const assetIds = assetFiles.map((file) => file.file_id).filter(Boolean);
    setVideoJobUIState({ jobId: null, streamId: null, step: null, stepStatus: null, error: null });
    setVideoSubmitting(true);
    try {
      const response = await createVideoJobMutation.mutateAsync({
        asset_ids: assetIds,
        template_type: videoTemplate,
        platform_preset: videoPreset,
        prompt: textValue,
      });
      setVideoJobUIState({
        jobId: response.job_id,
        streamId: response.stream_id,
        step: 'import',
        stepStatus: 'running',
        error: null,
      });
      setFiles(new Map());
      setText('');
      methods.setValue('text', '', { shouldValidate: false });
    } catch (error) {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : localize('com_ui_video_job_failed'),
      }));
    } finally {
      setVideoSubmitting(false);
    }
  }, [
    createVideoJobMutation,
    files,
    methods,
    setVideoJobUIState,
    setFiles,
    setText,
    textValue,
    videoPreset,
    videoSubmitting,
    videoTemplate,
  ]);

  const showVideoNotice = useCallback((message: string) => {
    if (videoNoticeTimeoutRef.current) {
      clearTimeout(videoNoticeTimeoutRef.current);
    }
    setVideoNotice({ message, tone: 'info' });
    videoNoticeTimeoutRef.current = setTimeout(() => {
      setVideoNotice(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (videoNoticeTimeoutRef.current) {
        clearTimeout(videoNoticeTimeoutRef.current);
      }
      if (videoJobIndicatorTimeoutRef.current) {
        clearTimeout(videoJobIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const isVideoOrAudioFile = useCallback((file: ExtendedFile) => {
    const type = file.type ?? file.file?.type ?? '';
    if (type.startsWith('video/') || type.startsWith('audio/')) {
      return true;
    }
    const filename = file.file?.name ?? file.filename ?? '';
    return /\.(mp4|mov|m4v|mkv|webm|avi|wmv|flv|ogv|3gp|mp3|wav|ogg|m4a|flac|aac|opus|wma)$/i.test(
      filename,
    );
  }, []);

  useEffect(() => {
    if (videoMode) {
      setVideoNotice(null);
      return;
    }

    for (const file of files.values()) {
      const fileId = file.file_id;
      if (!fileId || notifiedVideoFilesRef.current.has(fileId)) {
        continue;
      }
      if (!isVideoOrAudioFile(file)) {
        continue;
      }
      notifiedVideoFilesRef.current.add(fileId);
      showVideoNotice(localize('com_ui_video_requires_mode'));
    }
  }, [files, isVideoOrAudioFile, localize, showVideoNotice, videoMode]);

  useEffect(() => {
    if (!videoJobUIState.error) {
      return;
    }
    const fileList = Array.from(files.values());
    const hasFiles = fileList.length > 0;
    const hasIncomplete = fileList.some((file) => (file.progress ?? 0) < 1);

    if (videoJobUIState.error === localize('com_ui_video_uploading_assets') && !hasIncomplete) {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: null,
      }));
    }

    if (videoJobUIState.error === localize('com_ui_video_assets_required') && hasFiles) {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: null,
      }));
    }
  }, [files, localize, setVideoJobUIState, videoJobUIState.error]);

  const activeVideoNotice = videoJobUIState.error
    ? { message: videoJobUIState.error, tone: 'error' as const }
    : videoNotice;

  const videoJobStatusKey = useMemo(() => {
    if (!videoJobUIState.jobId) {
      return null;
    }
    if (videoJobUIState.error) {
      if (videoJobUIState.error === localize('com_ui_video_stream_disconnected')) {
        return 'disconnected' as const;
      }
      return 'failed' as const;
    }
    if (videoJobUIState.step === 'package' && videoJobUIState.stepStatus === 'completed') {
      return 'completed' as const;
    }
    if (videoJobUIState.stepStatus === 'running') {
      return 'running' as const;
    }
    return 'pending' as const;
  }, [
    localize,
    videoJobUIState.error,
    videoJobUIState.jobId,
    videoJobUIState.step,
    videoJobUIState.stepStatus,
  ]);

  const videoJobStatusText = useMemo(() => {
    if (!videoJobUIState.jobId) {
      return '';
    }
    return localize('com_ui_video_job_status', {
      0: videoJobUIState.jobId,
      1: videoJobUIState.step ?? localize('com_ui_video_job_pending'),
      2: videoJobUIState.stepStatus ?? '',
    });
  }, [localize, videoJobUIState.jobId, videoJobUIState.step, videoJobUIState.stepStatus]);

  useEffect(() => {
    if (!videoJobUIState.jobId || !videoJobStatusKey) {
      setShowVideoJobIndicator(false);
      return;
    }
    setShowVideoJobIndicator(true);

    const isTerminal =
      videoJobStatusKey === 'completed' ||
      videoJobStatusKey === 'failed' ||
      videoJobStatusKey === 'disconnected';
    if (!isTerminal) {
      if (videoJobIndicatorTimeoutRef.current) {
        clearTimeout(videoJobIndicatorTimeoutRef.current);
      }
      return;
    }

    if (videoJobIndicatorTimeoutRef.current) {
      clearTimeout(videoJobIndicatorTimeoutRef.current);
    }
    videoJobIndicatorTimeoutRef.current = setTimeout(() => {
      setShowVideoJobIndicator(false);
    }, 6000);
  }, [videoJobStatusKey, videoJobUIState.jobId]);

  useEffect(() => {
    if (videoJobStatusKey !== 'disconnected') {
      return;
    }
    const now = Date.now();
    if (now - lastDisconnectToastRef.current < 6000) {
      return;
    }
    lastDisconnectToastRef.current = now;
    showToast({
      message: localize('com_ui_video_stream_disconnected'),
      status: 'error',
      duration: 3000,
    });
  }, [localize, showToast, videoJobStatusKey]);

  const videoJobIndicator = useMemo(() => {
    if (!showVideoJobIndicator || !videoJobStatusKey) {
      return null;
    }
    const baseBarClass = 'absolute inset-0 rounded-full transition-all duration-200 ease-out';
    const barStyles: Record<
      typeof videoJobStatusKey,
      { className?: string; style?: React.CSSProperties }
    > = {
      running: {
        className: baseBarClass,
        style: {
          backgroundImage:
            'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.9) 50%, rgba(59,130,246,0.15) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.2s linear infinite, blink 0.6s linear infinite',
        },
      },
      completed: {
        className: `${baseBarClass} bg-green-500/80`,
      },
      failed: {
        className: `${baseBarClass} bg-red-500/80`,
      },
      disconnected: {
        className: `${baseBarClass} bg-orange-400/80`,
      },
      pending: {
        className: `${baseBarClass} bg-text-secondary/40`,
      },
    };

    const barConfig = barStyles[videoJobStatusKey];

    return (
      <div className="border-border-light bg-surface-tertiary relative h-2 w-14 overflow-hidden rounded-full border">
        <div className={barConfig.className} style={barConfig.style} />
      </div>
    );
  }, [showVideoJobIndicator, videoJobStatusKey]);

  useEffect(() => {
    const activeStreamId = videoJobUIState.streamId;
    if (!activeStreamId) {
      return;
    }

    const streamUrl = `${apiBaseUrl()}/api/agents/chat/stream/${activeStreamId}`;
    const sse = new EventSource(streamUrl, { withCredentials: true });

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === 'video_job_step') {
          const stepData = payload.data || {};
          const stepId = stepData.step_id || stepData.stepId || null;
          const stepStatus = stepData.status || null;
          setVideoJobUIState((prev) => ({
            ...prev,
            step: stepId,
            stepStatus,
            error:
              stepStatus === 'failed'
                ? stepData.error || localize('com_ui_video_job_failed')
                : prev.error,
          }));
        }
      } catch (error) {
        console.error('[VideoJob] Failed to parse SSE payload', error);
      }
    };

    sse.addEventListener('message', handleMessage as EventListener);
    sse.addEventListener('error', () => {
      setVideoJobUIState((prev) => ({
        ...prev,
        error: localize('com_ui_video_stream_disconnected'),
      }));
    });

    return () => {
      sse.close();
    };
  }, [setVideoJobUIState, videoJobUIState.streamId]);

  useEffect(() => {
    if (textAreaRef.current) {
      const style = window.getComputedStyle(textAreaRef.current);
      const lineHeight = parseFloat(style.lineHeight);
      setVisualRowCount(Math.floor(textAreaRef.current.scrollHeight / lineHeight));
    }
  }, [textValue]);

  useEffect(() => {
    if (isEditingBadges && backupBadges.length === 0) {
      setBackupBadges([...badges]);
    }
  }, [isEditingBadges, badges, backupBadges.length]);

  const handleSaveBadges = useCallback(() => {
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [setIsEditingBadges, setBackupBadges]);

  const handleCancelBadges = useCallback(() => {
    if (backupBadges.length > 0) {
      setBadges([...backupBadges]);
    }
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [backupBadges, setBadges, setIsEditingBadges]);

  const isMoreThanThreeRows = visualRowCount > 3;

  const baseClasses = useMemo(
    () =>
      cn(
        'md:py-3.5 m-0 w-full resize-none py-[13px] placeholder-black/60 bg-transparent dark:placeholder-white/60 [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)]',
        isCollapsed ? 'max-h-[52px]' : 'max-h-[45vh] md:max-h-[55vh]',
        isMoreThanThreeRows ? 'pl-5' : 'px-5',
      ),
    [isCollapsed, isMoreThanThreeRows],
  );

  return (
    <form
      onSubmit={methods.handleSubmit(videoMode ? handleVideoSubmit : submitMessage)}
      className={cn(
        'mx-auto flex w-full flex-row gap-3 transition-[max-width] duration-300 sm:px-2',
        maximizeChatSpace ? 'max-w-full' : 'md:max-w-3xl xl:max-w-4xl',
        centerFormOnLanding &&
          (conversationId == null || conversationId === Constants.NEW_CONVO) &&
          !isSubmitting &&
          conversation?.messages?.length === 0
          ? 'transition-all duration-200 sm:mb-28'
          : 'sm:mb-10',
      )}
    >
      <div className="relative flex h-full flex-1 items-stretch md:flex-col">
        <div className={cn('flex w-full items-center', isRTL && 'flex-row-reverse')}>
          <Mention
            index={index}
            popoverAtom={plusPopoverAtom}
            newConversation={generateConversation}
            textAreaRef={textAreaRef}
            commandChar="+"
            placeholder="com_ui_add_model_preset"
            includeAssistants={false}
          />
          <Mention
            index={index}
            popoverAtom={mentionPopoverAtom}
            newConversation={newConversation}
            textAreaRef={textAreaRef}
          />
          <PromptsCommand index={index} textAreaRef={textAreaRef} submitPrompt={submitPrompt} />
          <SkillsCommand
            index={index}
            textAreaRef={textAreaRef}
            conversationId={conversationId}
            agentId={conversation?.agent_id}
          />
          <div
            onClick={handleContainerClick}
            className={cn(
              'text-text-primary relative flex w-full flex-grow flex-col overflow-hidden rounded-t-3xl border pb-4 transition-all duration-200 sm:rounded-3xl sm:pb-0',
              isTextAreaFocused ? 'shadow-lg' : 'shadow-md',
              isTemporary
                ? 'border-violet-800/60 bg-violet-950/10'
                : 'border-border-light bg-surface-chat',
            )}
          >
            <TextareaHeader addedConvo={addedConvo} setAddedConvo={setAddedConvo} />
            <PendingManualSkillsChips conversationId={conversationId} />
            {/* WIP */}
            <EditBadges
              isEditingChatBadges={isEditingBadges}
              handleCancelBadges={handleCancelBadges}
              handleSaveBadges={handleSaveBadges}
              setBadges={setBadges}
            />
            <FileFormChat
              conversation={conversation}
              files={files}
              setFiles={setFiles}
              setFilesLoading={setFilesLoading}
            />
            {endpoint && (
              <div className={cn('flex', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <div
                  className="relative flex-1"
                  style={
                    isCollapsed
                      ? {
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 90%)',
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 90%)',
                        }
                      : undefined
                  }
                >
                  <TextareaAutosize
                    {...registerProps}
                    ref={(e) => {
                      ref(e);
                      (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current =
                        e;
                    }}
                    disabled={disableInputs || isNotAppendable}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    id={mainTextareaId}
                    tabIndex={0}
                    data-testid="text-input"
                    rows={1}
                    onFocus={handleTextareaFocus}
                    onBlur={handleTextareaBlur}
                    aria-label={localize('com_ui_message_input')}
                    onClick={handleFocusOrClick}
                    style={{ height: 44, overflowY: 'auto' }}
                    className={cn(
                      baseClasses,
                      removeFocusRings,
                      'scrollbar-hover transition-[max-height] duration-200 disabled:cursor-not-allowed',
                    )}
                  />
                </div>
                <div className="flex flex-col items-start justify-start pt-1.5 pr-2.5">
                  <CollapseChat
                    isCollapsed={isCollapsed}
                    isScrollable={isMoreThanThreeRows}
                    setIsCollapsed={setIsCollapsed}
                  />
                </div>
              </div>
            )}
            <div
              className={cn(
                'items-between @container flex gap-2 pb-2',
                isRTL ? 'flex-row-reverse' : 'flex-row',
              )}
              data-chat-input-controls
            >
              <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                <AttachFileChat
                  conversation={conversation}
                  disableInputs={disableInputs}
                  files={files}
                  setFiles={setFiles}
                  setFilesLoading={setFilesLoading}
                />
              </div>
              <BadgeRow
                showEphemeralBadges={
                  !!endpoint &&
                  !hideBadgeRow &&
                  !isAgentsEndpoint(endpoint) &&
                  !isAssistantsEndpoint(endpoint)
                }
                isSubmitting={isSubmitting}
                conversationId={conversationId}
                specName={conversation?.spec}
                onChange={setBadges}
                onMenuStores={handleBadgeMenuStores}
                isInChat={
                  Array.isArray(conversation?.messages) && conversation.messages.length >= 1
                }
              />
              <div className="mx-auto flex" />
              {videoJobIndicator && (
                <TooltipAnchor
                  description={videoJobStatusText}
                  side="top"
                  render={<div className="flex h-7 w-16 items-center justify-center" />}
                >
                  {videoJobIndicator}
                </TooltipAnchor>
              )}
              {SpeechToText && (
                <AudioRecorder
                  methods={methods}
                  ask={submitMessage}
                  textAreaRef={textAreaRef}
                  disabled={disableInputs || isNotAppendable}
                  isSubmitting={isSubmitting}
                />
              )}
              <div className={cn('flex items-center gap-2', isRTL ? 'ml-2' : 'mr-2')}>
                {isSubmitting && showStopButton ? (
                  <StopButton stop={handleStopGenerating} setShowStopButton={setShowStopButton} />
                ) : (
                  endpoint && (
                    <SendButton
                      ref={submitButtonRef}
                      control={methods.control}
                      disabled={
                        filesLoading ||
                        isSubmitting ||
                        videoSubmitting ||
                        disableInputs ||
                        isNotAppendable
                      }
                    />
                  )
                )}
              </div>
            </div>
            {activeVideoNotice && (
              <HoverCard open={true} onOpenChange={() => undefined}>
                <HoverCardTrigger
                  tabIndex={-1}
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute bottom-14 z-20 h-1 w-1',
                    isRTL ? 'left-3' : 'right-3',
                  )}
                />
                <HoverCardPortal>
                  <HoverCardContent
                    side="top"
                    align={isRTL ? 'start' : 'end'}
                    className={cn(
                      'pointer-events-none w-auto max-w-[260px] px-3 py-2 text-xs',
                      activeVideoNotice.tone === 'error'
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-black-200 bg-black-50 text-black-700',
                    )}
                  >
                    <span role="status" aria-live="polite">
                      {activeVideoNotice.message}
                    </span>
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCard>
            )}
            {TextToSpeech && automaticPlayback && <StreamAudio index={index} />}
          </div>
        </div>
      </div>
    </form>
  );
});
ChatForm.displayName = 'ChatForm';

/**
 * Wrapper that subscribes to ChatContext and passes stable individual values
 * to the memo'd ChatForm. This prevents ChatForm from re-rendering on every
 * streaming chunk — it only re-renders when the specific values it uses change.
 */
function ChatFormWrapper({ index = 0 }: { index?: number }) {
  const {
    files,
    setFiles,
    conversation,
    isSubmitting,
    filesLoading,
    setFilesLoading,
    newConversation,
    handleStopGenerating,
  } = useChatContext();

  /**
   * Stabilize conversation reference: only update when rendering-relevant fields change,
   * not on every metadata update (e.g., title generation during streaming).
   */
  const hasMessages = (conversation?.messages?.length ?? 0) > 0;
  const stableConversation = useMemo(
    () => conversation,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      conversation?.conversationId,
      conversation?.endpoint,
      conversation?.endpointType,
      conversation?.agent_id,
      conversation?.assistant_id,
      conversation?.spec,
      conversation?.useResponsesApi,
      conversation?.model,
      hasMessages,
    ],
  );

  /** Stabilize function refs so they never trigger ChatForm re-renders */
  const handleStopRef = useRef(handleStopGenerating);
  handleStopRef.current = handleStopGenerating;
  const stableHandleStop = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => handleStopRef.current(e),
    [],
  );

  const newConvoRef = useRef(newConversation);
  newConvoRef.current = newConversation;
  const stableNewConversation: ConvoGenerator = useCallback(
    (...args: Parameters<ConvoGenerator>): ReturnType<ConvoGenerator> =>
      newConvoRef.current(...args),
    [],
  );

  return (
    <ChatForm
      index={index}
      files={files}
      setFiles={setFiles}
      conversation={stableConversation}
      isSubmitting={isSubmitting}
      filesLoading={filesLoading}
      setFilesLoading={setFilesLoading}
      newConversation={stableNewConversation}
      handleStopGenerating={stableHandleStop}
    />
  );
}

ChatFormWrapper.displayName = 'ChatFormWrapper';

export default ChatFormWrapper;
