import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alternateName } from 'librechat-data-provider';
import { Heart, MessagesSquare, Share2, Eye } from 'lucide-react';
import { useLikeConversationMutation } from 'librechat-data-provider/react-query';
import { TConversation, TMessage, TUser, buildTree } from 'librechat-data-provider';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  Avatar,
  Button,
  EmptyState,
  Spinner,
  useToastContext,
} from '@librechat/client';
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

    if (_title.length > 28) _title = _title.slice(0, 28) + '…';
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
      setConvoCreatedDate(isoDate.toISOString().slice(0, 10));

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
        <EmptyState icon={MessagesSquare} description={emptyMessage()} className="min-h-[300px]" />
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
    <div className="bg-surface-canvas flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-8">
        {/* Tab bar */}
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

        {/* Conversation card */}
        <div className="border-border-light bg-surface-primary w-full overflow-hidden rounded-xl border shadow-sm">
          {/* Card header */}
          <div className="border-border-light bg-surface-secondary border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              {/* Title + author */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  {convoUser && (
                    <button
                      type="button"
                      onClick={navigateToProfile}
                      aria-label={`${localize('com_ui_profile')}: ${convoUser.username ?? ''}`}
                      className="hover:bg-surface-hover flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 transition-colors"
                    >
                      <Avatar user={convoUser} size={28} />
                      <span className="text-text-primary truncate text-sm font-medium">
                        {convoUser?.username}
                      </span>
                    </button>
                  )}
                  {getConversationTitle() && (
                    <span className="bg-surface-tertiary text-text-primary max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {getConversationTitle()}
                    </span>
                  )}
                </div>
                {hasConvo && currentConvo?.title && (
                  <h2 className="text-text-primary line-clamp-2 text-base font-semibold">
                    {currentConvo.title}
                  </h2>
                )}
                <div className="text-text-secondary flex items-center gap-2 text-xs">
                  <span>{ConvoCreatedDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={copyShareLinkHandler}
                  aria-label={localize('com_ui_share')}
                >
                  <Share2 className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{localize('com_ui_share')}</span>
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={likeConversation}
                  aria-label={localize('com_ui_number_of_likes', {
                    0: numOfLikes ? numOfLikes.toString() : '0',
                  })}
                  aria-pressed={liked}
                >
                  <Heart
                    className={`size-4 ${liked ? 'text-status-error fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  <span className={liked ? 'text-status-error font-medium' : ''}>
                    {localize('com_ui_number_of_likes', {
                      0: numOfLikes ? numOfLikes.toString() : '0',
                    })}
                  </span>
                </Button>
                <span
                  className="text-text-primary flex items-center gap-1 px-2 text-sm"
                  title={localize('com_ui_number_of_views', {
                    0: viewCount ? viewCount.toString() : '0',
                  })}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  {localize('com_ui_number_of_views', {
                    0: viewCount ? viewCount.toString() : '0',
                  })}
                </span>
              </div>
            </div>
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
    </div>
  );
}
