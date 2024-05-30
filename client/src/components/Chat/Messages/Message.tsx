import { useRecoilValue } from 'recoil';
import { useAuthContext, useMessageHelpers, useLocalize } from '~/hooks';
import type { TMessageProps } from '~/common';
import Icon from '~/components/Chat/Messages/MessageIcon';
import { Plugin } from '~/components/Messages/Content';
import MessageContent from './Content/MessageContent';
import SiblingSwitch from './SiblingSwitch';
// eslint-disable-next-line import/no-cycle
import MultiMessage from './MultiMessage';
import HoverButtons from './HoverButtons';
import SubRow from './SubRow';
import { cn } from '~/utils';
import store from '~/store';
import Error from '~/components/Messages/Content/Error';

export default function Message(props: TMessageProps) {
  const UsernameDisplay = useRecoilValue<boolean>(store.UsernameDisplay);
  const { user } = useAuthContext();
  const localize = useLocalize();
  const synth = window.speechSynthesis;
  const autoScroll = useRecoilValue(store.autoScroll);
  const {
    message,
    // scrollToBottom,
    currentEditId,
    setCurrentEditId,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
  } = props;

  const {
    ask,
    edit,
    isLast,
    enterEdit,
    handleScroll,
    conversation,
    isSubmitting,
    latestMessage,
    handleContinue,
    copyToClipboard,
    regenerateMessage,
  } = useMessageHelpers(props);

  //   const { message, siblingIdx, siblingCount, setSiblingIdx, currentEditId, setCurrentEditId } = props;

  if (!message) {
    return null;
  }

  const { text, children, messageId = null, isCreatedByUser, error, unfinished } = message ?? {};

  let messageLabel = '';
  if (isCreatedByUser) {
    messageLabel = UsernameDisplay ? user?.name || user?.username : localize('com_user_message');
  } else {
    messageLabel = message.sender;
  }

  const speak = (msg, updateHoverButtons) => {
    const cb = Symbol('stopCallback');
    const u = new SpeechSynthesisUtterance();
    u.lang = 'zh-CN';
    u.text = msg;
    u[cb] = updateHoverButtons;
    // console.log(msg);
    u.onend = (event) => {
      // console.log('Finshed speaking')
      event.utterance[cb]({ isStopped: true, isPaused: false });
    };
    synth.speak(u);
  };

  const pause = () => {
    synth.pause();
  };

  const resume = () => {
    synth.resume();
  };

  const stop = () => {
    synth.cancel();
  };

  const playbackMessage = (status, setStatus) => {
    let { isStopped, isPaused } = status;
    if (isStopped && !isPaused) {
      // console.log('(1) status ==> stopped: ' + isStopped + '->false, paused: ' + isPaused + ', text: ' + text)
      isStopped = false;
      stop();
      if (text) {
        setStatus({ isStopped, isPaused });
        if (error) {
          const errMsg = Error({ text });
          speak(errMsg, setStatus);
        } else {
          speak(text, setStatus);
        }
      }
    } else if (!isStopped && !isPaused) {
      // console.log('(2) status ==> stopped: ' + isStopped + ', paused: ' + isPaused + '->true, text: ' + text)
      isPaused = true;
      setStatus({ isStopped, isPaused });
      pause();
    } else if (!isStopped && isPaused) {
      // console.log('(3) status ==> stopped: ' + isStopped + ', paused: ' + isPaused + '->false, text: ' + text)
      isPaused = false;
      setStatus({ isStopped, isPaused });
      resume();
    } else {
      console.log('paly back status: ' + isStopped + ' ' + isPaused);
    }
  };

  const stopPlaybackMessage = (status, setStatus) => {
    let { isStopped, isPaused } = status;
    if (isStopped) {
      // console.log('(1) stop ==> ' + isStopped + ' ' + isPaused)
      // pass
    } else {
      // console.log('(2) stop ==> ' + isStopped + ' ' + isPaused)
      isStopped = true;
      isPaused = false;
      setStatus({ isStopped, isPaused });
      stop();
    }
  };

  return (
    <>
      <div
        className="text-token-text-primary w-full border-0 bg-transparent dark:border-0 dark:bg-transparent"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        <div className="m-auto justify-center p-4 py-2 text-base md:gap-6 ">
          <div className="final-completion group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
            <div className="relative flex flex-shrink-0 flex-col items-end">
              <div>
                <div className="pt-0.5">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                    <Icon message={message} conversation={conversation} />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={cn('relative flex w-11/12 flex-col', isCreatedByUser ? '' : 'agent-turn')}
            >
              <div className="select-none font-semibold">{messageLabel}</div>
              <div className="flex-col gap-1 md:gap-3">
                <div className="flex max-w-full flex-grow flex-col gap-0">
                  {/* Legacy Plugins */}
                  {message?.plugin && <Plugin plugin={message?.plugin} />}
                  <MessageContent
                    ask={ask}
                    edit={edit}
                    isLast={isLast}
                    text={text ?? ''}
                    message={message}
                    enterEdit={enterEdit}
                    error={!!error}
                    isSubmitting={isSubmitting}
                    unfinished={unfinished ?? false}
                    isCreatedByUser={isCreatedByUser ?? true}
                    siblingIdx={siblingIdx ?? 0}
                    setSiblingIdx={
                      setSiblingIdx ??
                      (() => {
                        return;
                      })
                    }
                  />
                </div>
              </div>
              {isLast && isSubmitting ? null : (
                <SubRow classes="text-xs">
                  <SiblingSwitch
                    siblingIdx={siblingIdx}
                    siblingCount={siblingCount}
                    setSiblingIdx={setSiblingIdx}
                  />
                  <HoverButtons
                    showStopButton={false}
                    isEditing={edit}
                    message={message}
                    enterEdit={enterEdit}
                    isSubmitting={isSubmitting}
                    conversation={conversation ?? null}
                    regenerate={() => regenerateMessage()}
                    copyToClipboard={copyToClipboard}
                    handleContinue={handleContinue}
                    latestMessage={latestMessage}
                    stopPlaybackMessage={stopPlaybackMessage}
                    playbackMessage={playbackMessage}
                    isLast={isLast}
                  />
                </SubRow>
              )}
            </div>
          </div>
        </div>
      </div>
      <MultiMessage
        key={messageId}
        messageId={messageId}
        conversation={conversation}
        messagesTree={children ?? []}
        currentEditId={currentEditId}
        setCurrentEditId={setCurrentEditId}
      />
    </>
  );
}
