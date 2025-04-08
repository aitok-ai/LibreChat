import { memo, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useGetMessagesByConvoId } from 'librechat-data-provider/react-query';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import ConversationStarters from './Input/ConversationStarters';
import MessagesView from './Messages/MessagesView';
import { Spinner } from '~/components/svg';
import Presentation from './Presentation';
import ChatForm from './Input/ChatForm';
import { buildTree } from '~/utils';
import Landing from './Landing';
import Header from './Header';
import Footer from './Footer';
import store from '~/store';
import ChatWidget from '../Input/ChatWidgetMenu';
import MessageHeaderButtons from '../Messages/MessageHeaderButtons';

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const rootSubmission = useRecoilValue(store.submissionByIndex(index));
  const addedSubmission = useRecoilValue(store.submissionByIndex(index + 1));
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);

  const fileMap = useFileMapContext();

  const { data: messagesTree = null, isLoading } = useGetMessagesByConvoId(conversationId ?? '', {
    select: useCallback(
      (data: TMessage[]) => {
        const dataTree = buildTree({ messages: data, fileMap });
        return dataTree?.length === 0 ? null : (dataTree ?? null);
      },
      [fileMap],
    ),
    enabled: !!fileMap,
  });

  const chatHelpers = useChatHelpers(index, conversationId);
  const addedChatHelpers = useAddedResponse({ rootIndex: index });

  useSSE(rootSubmission, chatHelpers, false);
  useSSE(addedSubmission, addedChatHelpers, true);

  const methods = useForm<ChatFormValues>({
    defaultValues: { text: '' },
  });

  let content, content_message_header: JSX.Element | null | undefined;
  const isLandingPage = !messagesTree || messagesTree.length === 0;

  if (isLoading && conversationId !== 'new') {
    content = (
      <div className="relative flex-1 overflow-hidden overflow-y-auto">
        <div className="relative flex h-full items-center justify-center">
          <Spinner className="text-text-primary" />
        </div>
      </div>
    );
  } else if (!isLandingPage) {
    content = (
      <>
        {/* <MessageHeaderButtons conversationId={conversationId} index={index} /> */}
        <MessagesView messagesTree={messagesTree} />
      </>
    );
    content_message_header = <MessageHeaderButtons conversationId={conversationId} index={index} />;
  } else {
    content = <Landing centerFormOnLanding={centerFormOnLanding} />;
  }

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <AddedChatContext.Provider value={addedChatHelpers}>
          <Presentation>
            {content_message_header}
            <div className="flex h-full w-full flex-col">
              {!isLoading && <Header />}

              {isLandingPage ? (
                <>
                  <div className="flex flex-1 flex-col items-center justify-end sm:justify-center">
                    {content}
                    <div className="relative ml-[-16px] flex flex-row py-2 md:mb-[-16px] md:py-4 lg:mb-[+24px]">
                      <span className="flex w-full flex-row items-center justify-center gap-0 md:order-none md:m-auto md:gap-2">
                        <ChatWidget />
                      </span>
                    </div>
                    <div className="w-full max-w-3xl transition-all duration-200 xl:max-w-4xl">
                      <ChatForm index={index} />
                      <ConversationStarters />
                    </div>
                  </div>
                  <Footer />
                </>
              ) : (
                <div className="flex h-full flex-col overflow-y-auto">
                  {content}
                  <div className="w-full">
                    <ChatForm index={index} />
                    <Footer />
                  </div>
                </div>
              )}
            </div>
          </Presentation>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
