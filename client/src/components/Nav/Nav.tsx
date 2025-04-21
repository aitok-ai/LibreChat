import { useCallback, useEffect, useState, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type { TConversation, ConversationListResponse } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import {
  useLocalize,
  useHasAccess,
  useMediaQuery,
  useAuthContext,
  useLocalStorage,
  useNavScrolling,
  useConversations,
  useNewConvo,
} from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Conversations } from '~/components/Conversations';
import NavToggle from './NavToggle';
import SearchBar from './SearchBar';
import NewChat from './NewChat';
import { cn } from '~/utils';
import store from '~/store';
import NavLink from './NavLink';
import CheckMark from '../svg/CheckMark';
import Clipboard from '../svg/Clipboard';
import LeaderboardIcon from '../svg/LeaderboardIcon';
import NotebookIcon from '../svg/NotebookIcon';
import { useNavigate, useParams } from 'react-router-dom';
import HomeIcon from '../svg/HomeIcon';
import LightBulbIcon from '../svg/LightBulbIcon';
import ComputerIcon from '../svg/ComputerIcon';
import ProfileIcon from '../svg/UserIcon';

const BookmarkNav = lazy(() => import('./Bookmarks/BookmarkNav'));
const AccountSettings = lazy(() => import('./AccountSettings'));

const NAV_WIDTH_DESKTOP = '260px';
const NAV_WIDTH_MOBILE = '320px';

const NavMask = memo(
  ({ navVisible, toggleNavVisible }: { navVisible: boolean; toggleNavVisible: () => void }) => (
    <div
      id="mobile-nav-mask-toggle"
      role="button"
      tabIndex={0}
      className={`nav-mask ${navVisible ? 'active' : ''}`}
      onClick={toggleNavVisible}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleNavVisible();
        }
      }}
      aria-label="Toggle navigation"
    />
  ),
);

const MemoNewChat = memo(NewChat);

const Nav = memo(
  ({
    navVisible,
    setNavVisible,
  }: {
    navVisible: boolean;
    setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const localize = useLocalize();
    const { isAuthenticated, user } = useAuthContext();
    const { userId } = useParams();
    const navigate = useNavigate();

    const [navWidth, setNavWidth] = useState(NAV_WIDTH_DESKTOP);
    const isSmallScreen = useMediaQuery('(max-width: 768px)');
    const [newUser, setNewUser] = useLocalStorage('newUser', true);
    const [isToggleHovering, setIsToggleHovering] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [refLink, setRefLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [widget, setWidget] = useRecoilState(store.widget);

    const hasAccessToBookmarks = useHasAccess({
      permissionType: PermissionTypes.BOOKMARKS,
      permission: Permissions.USE,
    });

    const search = useRecoilValue(store.search);
    const { newConversation } = useNewConvo();

    const { data, fetchNextPage, isFetchingNextPage, isLoading, isFetching, refetch } =
      useConversationsInfiniteQuery(
        {
          tags: tags.length === 0 ? undefined : tags,
          search: search.debouncedQuery || undefined,
        },
        {
          enabled: isAuthenticated,
          staleTime: 30000,
          cacheTime: 300000,
        },
      );

    const computedHasNextPage = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        const lastPage: ConversationListResponse = data.pages[data.pages.length - 1];
        return lastPage.nextCursor !== null;
      }
      return false;
    }, [data?.pages]);

    const outerContainerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const { moveToTop } = useNavScrolling<ConversationListResponse>({
      setShowLoading,
      fetchNextPage: async (options?) => {
        if (computedHasNextPage) {
          return fetchNextPage(options);
        }
        return Promise.resolve(
          {} as InfiniteQueryObserverResult<ConversationListResponse, unknown>,
        );
      },
      isFetchingNext: isFetchingNextPage,
    });

    const conversations = useMemo(() => {
      return data ? data.pages.flatMap((page) => page.conversations) : [];
    }, [data]);

    const toggleNavVisible = useCallback(() => {
      setNavVisible((prev: boolean) => {
        localStorage.setItem('navVisible', JSON.stringify(!prev));
        return !prev;
      });
      if (newUser) {
        setNewUser(false);
      }
    }, [newUser, setNavVisible, setNewUser]);

    const itemToggleNav = useCallback(() => {
      if (isSmallScreen) {
        toggleNavVisible();
      }
    }, [isSmallScreen, toggleNavVisible]);

    const copyLinkHandler = () => {
      navigator.clipboard.writeText(refLink);
      setCopied(true);
    };

    const navigateToRegister = () => {
      if (!user && userId) {
        navigate(`/register/${userId}`);
      } else {
        navigate('/register');
      }
    };

    const openWidgetHandler = (type) => () => {
      if (
        location.pathname.substring(1, 5) !== 'chat' ||
        location.pathname.substring(0, 11) === '/chat/share'
      ) {
        newConversation();
        navigate('/c/new');
        setWidget(`${type}`);
      } else {
        setWidget(widget === `${type}` ? '' : `${type}`);
      }
    };

    const openWritingAssistantHandler = openWidgetHandler('wa');
    const openCodingAssistantHandler = openWidgetHandler('ca');
    const openAskMeAnythingHandler = openWidgetHandler('ama');
    const openLeaderboardHandler = () => navigate('/leaderboard');
    const openHomepageHandler = () => navigate('/home');
    const openProfileHandler = () => navigate(`/profile/${user?.id}`);

    useEffect(() => {
      if (isSmallScreen) {
        const savedNavVisible = localStorage.getItem('navVisible');
        if (savedNavVisible === null) {
          toggleNavVisible();
        }
        setNavWidth(NAV_WIDTH_MOBILE);
      } else {
        setNavWidth(NAV_WIDTH_DESKTOP);
      }
    }, [isSmallScreen, toggleNavVisible]);

    useEffect(() => {
      if (user) {
        setRefLink(window.location.protocol + '//' + window.location.host + `/register/${user.id}`);
      }
    }, [user]);

    useEffect(() => {
      setTimeout(() => {
        if (copied) {
          setCopied(!copied);
        }
      }, 2000);
    }, [copied]);

    useEffect(() => {
      refetch();
    }, [tags, refetch]);

    const loadMoreConversations = useCallback(() => {
      if (isFetchingNextPage || !computedHasNextPage) {
        return;
      }
      fetchNextPage();
    }, [isFetchingNextPage, computedHasNextPage, fetchNextPage]);

    const subHeaders = useMemo(
      () => (
        <>
          {search.enabled === true && <SearchBar isSmallScreen={isSmallScreen} />}
          {hasAccessToBookmarks && (
            <>
              <div className="mt-1.5" />
              <Suspense fallback={null}>
                <BookmarkNav tags={tags} setTags={setTags} isSmallScreen={isSmallScreen} />
              </Suspense>
            </>
          )}
        </>
      ),
      [search.enabled, hasAccessToBookmarks, isSmallScreen, tags, setTags],
    );

    const [isSearchLoading, setIsSearchLoading] = useState(
      !!search.query && (search.isTyping || isLoading || isFetching),
    );

    useEffect(() => {
      if (search.isTyping) {
        setIsSearchLoading(true);
      } else if (!isLoading && !isFetching) {
        setIsSearchLoading(false);
      } else if (!!search.query && (isLoading || isFetching)) {
        setIsSearchLoading(true);
      }
    }, [search.query, search.isTyping, isLoading, isFetching]);

    return (
      <>
        <div
          data-testid="nav"
          className={cn(
            'nav active max-w-[320px] flex-shrink-0 overflow-x-hidden bg-surface-primary-alt',
            'md:max-w-[260px]',
          )}
          style={{
            width: navVisible ? navWidth : '0px',
            visibility: navVisible ? 'visible' : 'hidden',
            transition: 'width 0.2s, visibility 0.2s',
          }}
        >
          <div className="h-full w-[320px] md:w-[260px]">
            <div className="flex h-full flex-col">
              <div
                className={cn(
                  'flex h-full flex-col transition-opacity',
                  isToggleHovering && !isSmallScreen ? 'opacity-50' : 'opacity-100',
                )}
              >
                <div className="flex h-full flex-col">
                  <nav
                    id="chat-history-nav"
                    aria-label={localize('com_ui_chat_history')}
                    className="flex h-full flex-col px-3 pb-3.5"
                  >
                    <div className="flex flex-1 flex-col" ref={outerContainerRef}>
                      <MemoNewChat
                        toggleNav={itemToggleNav}
                        isSmallScreen={isSmallScreen}
                        subHeaders={subHeaders}
                      />
                      <Conversations
                        conversations={conversations}
                        moveToTop={moveToTop}
                        toggleNav={itemToggleNav}
                        containerRef={listRef}
                        loadMoreConversations={loadMoreConversations}
                        isLoading={isFetchingNextPage || showLoading || isLoading}
                        isSearchLoading={isSearchLoading}
                      />
                    </div>
                    {user && (
                      <NavLink
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                        svg={() => <ProfileIcon />}
                        text={localize('com_ui_profile')}
                        clickHandler={openProfileHandler}
                      />
                    )}
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      svg={() => <HomeIcon />}
                      text={localize('com_ui_recommendation')}
                      clickHandler={user ? openHomepageHandler : navigateToRegister}
                    />
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      svg={() => <NotebookIcon />}
                      text={localize('com_ui_writing_assistant')}
                      clickHandler={user ? openWritingAssistantHandler : navigateToRegister}
                    />
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      svg={() => <ComputerIcon />}
                      text={localize('com_ui_coding_assistant')}
                      clickHandler={user ? openCodingAssistantHandler : navigateToRegister}
                    />
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      svg={() => <LightBulbIcon />}
                      text={localize('com_ui_ask_me_anything')}
                      clickHandler={user ? openAskMeAnythingHandler : navigateToRegister}
                    />
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      svg={() => <LeaderboardIcon />}
                      text={localize('com_ui_referrals_leaderboard')}
                      clickHandler={user ? openLeaderboardHandler : navigateToRegister}
                    />
                    {window.location.hostname !== 'drhu.aitok.ai' && (
                      <NavLink
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                        svg={() => (copied ? <CheckMark /> : <Clipboard />)}
                        text={
                          copied
                            ? localize('com_ui_copied_success')
                            : localize('com_ui_copy_invitation_link')
                        }
                        clickHandler={user ? copyLinkHandler : navigateToRegister}
                      />
                    )}
                    <Suspense fallback={null}>
                      <AccountSettings />
                    </Suspense>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NavToggle
          isHovering={isToggleHovering}
          setIsHovering={setIsToggleHovering}
          onToggle={toggleNavVisible}
          navVisible={navVisible}
          className="fixed left-0 top-1/2 z-40 hidden md:flex"
        />

        {isSmallScreen && <NavMask navVisible={navVisible} toggleNavVisible={toggleNavVisible} />}
      </>
    );
  },
);

Nav.displayName = 'Nav';

export default Nav;
