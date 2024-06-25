import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import type { TMessage } from 'librechat-data-provider';
import { VolumeIcon, VolumeMuteIcon, Spinner } from '~/components/svg';
import { useLocalize, useTextToSpeech } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

type THoverButtons = {
  message: TMessage;
  isLast: boolean;
  index: number;
};

export default function MessageAudio({ index, message, isLast }: THoverButtons) {
  const localize = useLocalize();
  const playbackRate = useRecoilValue(store.playbackRate);

  const { toggleSpeech, isSpeaking, isLoading, audioRef } = useTextToSpeech(message, isLast, index);

  const renderIcon = (size: string) => {
    if (isLoading) {
      return <Spinner size={size} />;
    }

    if (isSpeaking) {
      return <VolumeMuteIcon size={size} />;
    }

    return <VolumeIcon size={size} />;
  };

  useEffect(() => {
    const messageAudio = document.getElementById(
      `audio-${message.messageId}`,
    ) as HTMLAudioElement | null;
    if (!messageAudio) {
      return;
    }
    if (
      playbackRate &&
      playbackRate > 0 &&
      messageAudio &&
      messageAudio.playbackRate !== playbackRate
    ) {
      messageAudio.playbackRate = playbackRate;
    }
  }, [audioRef, isSpeaking, playbackRate, message.messageId]);

  return (
    <>
      <button
        // className="hover-button rounded-md p-1 pl-0 text-gray-400 hover:text-gray-950 dark:text-gray-400/70 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible"
        //</>className={cn(
        //  'hover-button active rounded-md p-1 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible ',
        //  'data-[state=open]:active data-[state=open]:bg-gray-200 data-[state=open]:text-gray-700 data-[state=open]:dark:bg-gray-700 data-[state=open]:dark:text-gray-200',
        //  !isLast ? 'data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100' : '',
        //)}
        className="hover-button rounded-md p-1 pl-0 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible"
        // onMouseDownCapture={() => {
        //   if (audioRef.current) {
        //     audioRef.current.muted = false;
        //   }
        //   handleMouseDown();
        // }}
        // onMouseUpCapture={() => {
        //   if (audioRef.current) {
        //     audioRef.current.muted = false;
        //   }
        //   handleMouseUp();
        // }}
        onClickCapture={() => {
          if (audioRef.current) {
            audioRef.current.muted = false;
          }
          toggleSpeech();
        }}
        type="button"
        title={isSpeaking ? localize('com_ui_stop') : localize('com_ui_read_aloud')}
      >
        {renderIcon('19')}
      </button>
      <audio
        ref={audioRef}
        controls
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{
          position: 'absolute',
          overflow: 'hidden',
          display: 'none',
          height: '0px',
          width: '0px',
        }}
        src={audioRef.current?.src || undefined}
        id={`audio-${message.messageId}`}
        muted
        autoPlay
      />
    </>
  );
}
