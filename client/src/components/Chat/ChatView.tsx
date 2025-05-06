import { memo, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Constants } from 'librechat-data-provider';
import { useGetMessagesByConvoId } from 'librechat-data-provider/react-query';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import ConversationStarters from './Input/ConversationStarters';
import MessagesView from './Messages/MessagesView';
import { Spinner } from '~/components/svg';
import Presentation from './Presentation';
import { buildTree, cn } from '~/utils';
import ChatForm from './Input/ChatForm';
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
  const isLandingPage =
    (!messagesTree || messagesTree.length === 0) &&
    (conversationId === Constants.NEW_CONVO || !conversationId);

  if (isLoading && conversationId !== Constants.NEW_CONVO) {
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
            <div className="flex h-screen flex-col">
              {!isLoading && <Header />}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div
                  className={cn(
                    'flex flex-1 flex-col overflow-y-auto',
                    isLandingPage ? 'items-center justify-center' : '',
                  )}
                >
                  {content}
                </div>
                <div className="relative flex w-full flex-col items-center">
                  <div className="relative w-full">
                    <ChatWidget />
                  </div>
                  <div
                    className={cn(
                      'w-full p-2',
                      isLandingPage && 'max-w-3xl transition-all duration-200 xl:max-w-4xl',
                    )}
                  >
                    <ChatForm index={index} />
                    {isLandingPage && <ConversationStarters />}
                  </div>
                </div>
              </div>
              <Footer />
            </div>
          </Presentation>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
