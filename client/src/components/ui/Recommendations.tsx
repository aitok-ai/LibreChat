import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@librechat/client';
import { useNavigate } from 'react-router-dom';
import { alternateName } from 'librechat-data-provider';
import { Tabs, TabsList, TabsTrigger, useToastContext } from '@librechat/client';
import { useLikeConversationMutation } from 'librechat-data-provider/react-query';
import { TConversation, TMessage, TUser, buildTree } from 'librechat-data-provider';
import useDocumentTitle from '~/hooks/useDocumentTitle';
import { useAuthContext } from '~/hooks/AuthContext';
import { useScreenshot, useLocalize } from '~/hooks';
import MessagesView from '../Share/MessagesView';
import { useGetFiles } from '~/data-provider';
import SwitchPage from './SwitchPage';
import { mapFiles } from '~/utils';

function toConversationList(payload: unknown): TConversation[] {
  return Array.isArray(payload) ? (payload as TConversation[]) : [];
}

function toMessageList(payload: unknown): TMessage[] {
  return Array.isArray(payload) ? (payload as TMessage[]) : [];
}

const tabClasses = 'flex-1';

export default function Recommendations() {
  const [tabValue, setTabValue] = useState<string>(
    window.sessionStorage.getItem('tab') || 'recent',
  );
  const [convoIdx, setConvoIdx] = useState(0);
  const [convoDataLength, setConvoDataLength] = useState(1);
  const [convoData, setConvoData] = useState<TConversation[] | null>(null);
  const [msgTree, setMsgTree] = useState<TMessage[] | null>(null);
  const [convoUser, setConvoUser] = useState<TUser | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [liked, setLiked] = useState(false);
  const [numOfLikes, setNumOfLikes] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [cache, setCache] = useState<{ user: TUser; messages: TMessage[] }[]>([]);
  const [cacheIdx, setCacheIdx] = useState(0);
  const [ConvoCreatedDate, setConvoCreatedDate] = useState('');

  // @ts-ignore
  const { user, token } = useAuthContext();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const title = localize('com_ui_recommendation');
  const navigate = useNavigate();
  const { data: fileMap } = useGetFiles({ select: mapFiles });
  const { screenshotTargetRef } = useScreenshot();

  const likeConvoMutation = useLikeConversationMutation(
    convoData && convoData.length > 0 ? convoData[convoIdx].conversationId || '' : '',
  );

  const navigateToProfile = () => navigate(`/profile/${convoUser?.id}`);

  const saveCache = useCallback(
    (value: { user: TUser; messages: TMessage[] }[]) => {
      window.sessionStorage.setItem(`${tabValue}Cache`, JSON.stringify(value));
    },
    [tabValue],
  );

  const saveIdx = useCallback(
    (value: { cacheIdx: number; convoIdx: number }) => {
      window.sessionStorage.setItem(`${tabValue}Idx`, JSON.stringify(value));
    },
    [tabValue],
  );

  const getConversationTitle = () => {
    if (!convoData || convoData.length < 1) return '';
    const conversation = convoData[convoIdx];
    const { endpoint, model } = conversation;
    let _title = `${alternateName[endpoint || 'openAI'] ?? endpoint}`;

    if (endpoint === 'azureOpenAI' || endpoint === 'openAI') {
      const { chatGptLabel } = conversation;
      if (model) _title += `: ${model}`;
      if (chatGptLabel) _title += ` as ${chatGptLabel}`;
    } else if (endpoint === 'google') {
      _title = 'PaLM';
      const { modelLabel, model } = conversation;
      if (model) _title += `: ${model}`;
      if (modelLabel) _title += ` as ${modelLabel}`;
    }

    if (_title.length > 16) _title = _title.slice(0, 16) + '...';
    return _title;
  };

  const fetchRecommendations = useCallback(async () => {
    setCache([]);
    setCacheIdx(0);
    setConvoIdx(0);
    setConvoData(null);
    setConvoUser(null);
    try {
      const response = await fetch(`/api/convos/${tabValue}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const responseObject = await response.json();
      const conversations = toConversationList(responseObject);
      window.sessionStorage.setItem(`${tabValue}Conversations`, JSON.stringify(conversations));
      setConvoData(conversations);
      setConvoDataLength(conversations.length);
    } catch (error) {
      console.log(error);
    }
  }, [tabValue, token]);

  const getRecommendations = useCallback(async () => {
    const conversations = window.sessionStorage.getItem(`${tabValue}Conversations`);
    const cacheLS = window.sessionStorage.getItem(`${tabValue}Cache`);
    const idxLS = window.sessionStorage.getItem(`${tabValue}Idx`);

    if (conversations && cacheLS && idxLS) {
      setConvoData(null);
      setConvoUser(null);
      const convoObject = toConversationList(JSON.parse(conversations));
      setConvoData(convoObject);
      setConvoDataLength(convoObject.length);
      const parsedCache = JSON.parse(cacheLS);
      const { cacheIdx, convoIdx } = JSON.parse(idxLS);
      setCache(parsedCache);
      setCacheIdx(cacheIdx);
      setConvoIdx(convoIdx);
    } else if (user) {
      fetchRecommendations();
    }
  }, [tabValue, user, fetchRecommendations]);

  const fetchConvoMessagesAndUser = useCallback(
    async (convoId: string, userId: string) => {
      setMsgTree(null);
      setConvoUser(null);
      try {
        const [messagesResponse, userResponse] = await Promise.all([
          fetch(`/api/messages/${convoId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/user/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          }),
        ]);
        const messagesResponseObject = await messagesResponse.json();
        const userResponseObject = await userResponse.json();
        const normalizedMessages = toMessageList(messagesResponseObject);
        const cacheObject = { user: userResponseObject, messages: normalizedMessages };

        if (cacheIdx > cache.length - 1) {
          const newLength = cache.push(cacheObject);
          if (newLength > 5) {
            cache.shift();
            setCacheIdx(4);
          }
        } else if (cacheIdx < 0) {
          const newLength = cache.unshift(cacheObject);
          setCacheIdx(0);
          if (newLength > 5) cache.pop();
        }

        saveCache(cache);
        saveIdx({ cacheIdx, convoIdx });
        setMsgTree(buildTree({ messages: normalizedMessages, fileMap }) || null);
        setConvoUser(userResponseObject);
      } catch (error) {
        console.log(error);
      }
    },
    [cacheIdx, convoIdx, cache, saveCache, saveIdx, fileMap, token],
  );

  async function likeConversation() {
    if (!convoData || !user) return;
    setLiked(!liked);
    if (!convoData[convoIdx].likedBy) convoData[convoIdx].likedBy = {};
    if (!convoData[convoIdx].likes) convoData[convoIdx].likes = 0;

    if (liked) {
      setNumOfLikes(numOfLikes - 1);
      convoData[convoIdx].likes = (convoData[convoIdx].likes || 0) - 1;
      delete convoData[convoIdx].likedBy[user.id];
    } else {
      setNumOfLikes(numOfLikes + 1);
      convoData[convoIdx].likes = (convoData[convoIdx].likes || 0) + 1;
      convoData[convoIdx].likedBy[user.id] = new Date();
    }

    const conversationId = convoData[convoIdx].conversationId;
    likeConvoMutation.mutate({ conversationId, userId: user.id, liked: !liked });
  }

  const nextConvo = () => {
    convoIdx === convoDataLength - 1 ? setConvoIdx(0) : setConvoIdx(convoIdx + 1);
    setCacheIdx(cacheIdx + 1);
  };

  const prevConvo = () => {
    convoIdx === 0 ? setConvoIdx(convoDataLength - 1) : setConvoIdx(convoIdx - 1);
    setCacheIdx(cacheIdx - 1);
  };

  const copyShareLinkHandler = () => {
    navigator.clipboard.writeText(shareLink);
    showToast({ message: localize('com_ui_copied_success'), status: 'success' });
  };

  const tabClickHandler = (value: string) => () => {
    if (tabValue === value) fetchRecommendations();
    else setTabValue(value);
  };

  const incrementViewCount = useCallback(async (conversationId: string | undefined) => {
    try {
      const response = await fetch(`/api/convos/${conversationId}/viewcount/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const responseObject = await response.json();
      setViewCount(responseObject?.viewCount);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    getRecommendations();
    window.sessionStorage.setItem('tab', tabValue);
  }, [user, tabValue, getRecommendations]);

  useEffect(() => {
    if (convoData && convoData.length > 0 && user) {
      if (cache[cacheIdx]) {
        const { user: cachedUser, messages } = cache[cacheIdx];
        const normalizedMessages = toMessageList(messages);
        setMsgTree(buildTree({ messages: normalizedMessages }) || null);
        setConvoUser(cachedUser);
      } else {
        fetchConvoMessagesAndUser(
          convoData[convoIdx].conversationId || 'null',
          convoData[convoIdx].user || '',
        );
      }

      setShareLink(
        window.location.protocol +
          '//' +
          window.location.host +
          `/chat/share/${convoData[convoIdx].conversationId}`,
      );
      setNumOfLikes(convoData[convoIdx].likes || 0);

      const isoDate = new Date(convoData[convoIdx].createdAt);
      setConvoCreatedDate(
        `${isoDate.getFullYear()}-${isoDate.getMonth() + 1}-${isoDate.getDate()}`,
      );

      const likedBy = convoData[convoIdx].likedBy;
      setLiked(likedBy ? !!likedBy[user.id] : false);

      incrementViewCount(convoData[convoIdx].conversationId || 'null');
      saveIdx({ cacheIdx, convoIdx });
    }
  }, [
    convoData,
    convoIdx,
    user,
    cache,
    cacheIdx,
    fetchConvoMessagesAndUser,
    incrementViewCount,
    saveIdx,
  ]);

  useDocumentTitle(title);

  const hasConvo = convoData && convoData.length > 0;
  const currentConvo = hasConvo ? convoData[convoIdx] : null;
  const isLoading = !convoData && !convoUser;

  const emptyMessage = () => {
    if (tabValue !== 'following') return localize('com_ui_empty_database');
    return Object.keys(user?.following || {}).length === 0
      ? localize('com_ui_no_following')
      : localize('com_ui_following_no_convo');
  };

  const renderMessages = () => {
    if (convoData?.length === 0) {
      return (
        <div className="text-text-tertiary flex h-[300px] items-center justify-center">
          {emptyMessage()}
        </div>
      );
    }
    if (hasConvo && msgTree && convoUser) {
      return (
        <MessagesView
          messagesTree={msgTree}
          conversationId={convoData[convoIdx].conversationId ?? ''}
        />
      );
    }
    if (isLoading) {
      return (
        <div className="flex h-[25vh] items-end justify-end p-4">
          <Spinner />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pt-4">
      {/* Tab bar */}
      <div className="mx-auto w-full max-w-3xl">
        <Tabs value={tabValue} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="recent" className={tabClasses} onClick={tabClickHandler('recent')}>
              {localize('com_ui_recent')}
            </TabsTrigger>
            <TabsTrigger
              value="hottest"
              className={tabClasses}
              onClick={tabClickHandler('hottest')}
            >
              {localize('com_ui_hottest')}
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className={tabClasses}
              onClick={tabClickHandler('following')}
            >
              {localize('com_ui_my_following')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation card */}
      <div className="border-border-light bg-surface-primary mx-auto w-full max-w-3xl overflow-hidden rounded-xl border shadow-sm">
        {/* Card header */}
        <div className="border-border-light bg-surface-secondary border-b px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Title + author */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {convoUser && (
                <button
                  onClick={navigateToProfile}
                  className="hover:bg-surface-hover flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 transition-colors"
                >
                  <img
                    className="h-7 w-7 rounded-full"
                    src={
                      convoUser?.avatar ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${convoUser?.name}&fontFamily=Verdana&fontSize=36`
                    }
                    alt="avatar"
                  />
                  <span className="text-text-secondary truncate text-sm font-medium">
                    {convoUser?.username}
                  </span>
                </button>
              )}
              <span className="bg-surface-tertiary text-text-secondary shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
                {getConversationTitle()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={copyShareLinkHandler}
                className="text-text-tertiary hover:bg-surface-hover hover:text-text-secondary flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M9 6L12 3M12 3L15 6M12 3V13M7 10C6.068 10 5.602 10 5.235 10.152C4.745 10.355 4.355 10.745 4.152 11.235C4 11.602 4 12.068 4 13V17.8C4 18.92 4 19.48 4.218 19.908C4.41 20.284 4.715 20.59 5.092 20.782C5.519 21 6.079 21 7.197 21H16.804C17.922 21 18.481 21 18.908 20.782C19.284 20.59 19.591 20.284 19.782 19.908C20 19.48 20 18.921 20 17.803V13C20 12.068 19.999 11.602 19.848 11.235C19.645 10.745 19.255 10.355 18.765 10.152C18.398 10 17.932 10 17 10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {localize('com_ui_share')}
              </button>

              <button
                onClick={likeConversation}
                className="hover:bg-surface-hover flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  stroke="currentColor"
                  fill={liked ? 'currentColor' : 'none'}
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                <span className={liked ? 'text-status-error font-medium' : 'text-text-tertiary'}>
                  {localize('com_ui_number_of_likes', {
                    0: numOfLikes ? numOfLikes.toString() : '0',
                  })}
                </span>
              </button>

              <span className="text-text-tertiary px-2 text-sm">
                {localize('com_ui_number_of_views', { 0: viewCount ? viewCount.toString() : '0' })}
              </span>
            </div>
          </div>

          {/* Meta row */}
          {hasConvo && currentConvo?.title && (
            <div className="text-text-primary mt-2 text-sm font-semibold">{currentConvo.title}</div>
          )}
          <div className="text-text-tertiary mt-1 text-xs">{ConvoCreatedDate}</div>
        </div>

        {/* Messages */}
        <div className="relative min-h-[300px] overflow-hidden" ref={screenshotTargetRef}>
          {renderMessages()}

          {/* Page switchers */}
          {hasConvo && convoDataLength > 1 && (
            <>
              <SwitchPage key="left_switch" switchHandler={prevConvo} direction="left" />
              <SwitchPage key="right_switch" switchHandler={nextConvo} direction="right" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
