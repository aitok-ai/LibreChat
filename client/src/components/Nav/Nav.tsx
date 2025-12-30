import { useRecoilState, useRecoilValue } from 'recoil';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
  lazy,
  Suspense,
  useRef,
  startTransition,
} from 'react';
import { Skeleton, useMediaQuery } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import type { ConversationListResponse } from 'librechat-data-provider';
import type { List } from 'react-virtualized';
import {
  useLocalize,
  useHasAccess,
  useAuthContext,
  useLocalStorage,
  useNavScrolling,
  useConversations,
  useNewConvo,
} from '~/hooks';
import { useConversationsInfiniteQuery, useTitleGeneration } from '~/data-provider';
import { Conversations } from '~/components/Conversations';
import SearchBar from './SearchBar';
import NewChat from './NewChat';
import { cn } from '~/utils';
import store from '~/store';
import NavLink from './NavLink';
import { CheckMark } from '@librechat/client';
import { Clipboard } from '@librechat/client';
import { LeaderboardIcon } from '@librechat/client';
import { NotebookIcon } from '@librechat/client';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeIcon } from '@librechat/client';
import { LightBulbIcon } from '@librechat/client';
import { ComputerIcon } from '@librechat/client';
import { UserIcon } from '@librechat/client';

const BookmarkNav = lazy(() => import('./Bookmarks/BookmarkNav'));
const AccountSettings = lazy(() => import('./AccountSettings'));

export const NAV_WIDTH = {
  MOBILE: 320,
  DESKTOP: 260,
} as const;

const SearchBarSkeleton = memo(() => (
  <div className={cn('flex h-10 items-center py-2')}>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
));

SearchBarSkeleton.displayName = 'SearchBarSkeleton';

const NavMask = memo(
  ({ navVisible, toggleNavVisible }: { navVisible: boolean; toggleNavVisible: () => void }) => (
    <div
      id="mobile-nav-mask-toggle"
      role="button"
      tabIndex={0}
      className={`nav-mask transition-opacity duration-200 ease-in-out ${navVisible ? 'active opacity-100' : 'opacity-0'}`}
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
    useTitleGeneration(isAuthenticated);

    const isSmallScreen = useMediaQuery('(max-width: 768px)');
    const [newUser, setNewUser] = useLocalStorage('newUser', true);
    const [isChatsExpanded, setIsChatsExpanded] = useLocalStorage('chatsExpanded', true);
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
    const conversationsRef = useRef<List | null>(null);

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
      // Use startTransition to mark this as a non-urgent update
      // This prevents blocking the main thread during the cascade of re-renders
      startTransition(() => {
        setNavVisible((prev: boolean) => {
          localStorage.setItem('navVisible', JSON.stringify(!prev));
          return !prev;
        });
        if (newUser) {
          setNewUser(false);
        }
      });
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
          {search.enabled === null && <SearchBarSkeleton />}
          {search.enabled === true && <SearchBar isSmallScreen={isSmallScreen} />}
        </>
      ),
      [search.enabled, isSmallScreen],
    );

    const headerButtons = useMemo(
      () => (
        <>
          {hasAccessToBookmarks && (
            <>
              <div className="mt-1.5" />
              <Suspense fallback={null}>
                <BookmarkNav tags={tags} setTags={setTags} />
              </Suspense>
            </>
          )}
        </>
      ),
      [hasAccessToBookmarks, tags],
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

    // Always render sidebar to avoid mount/unmount costs
    // Use transform for GPU-accelerated animation (no layout thrashing)
    const sidebarWidth = isSmallScreen ? NAV_WIDTH.MOBILE : NAV_WIDTH.DESKTOP;

    // Sidebar content (shared between mobile and desktop)
    const sidebarContent = (
      <div className="flex h-full flex-col">
        <nav
          id="chat-history-nav"
          aria-label={localize('com_ui_chat_history')}
          className="flex h-full flex-col px-2 pb-3.5"
          aria-hidden={!navVisible ? 'true' : 'false'}
        >
          <div className="flex flex-1 flex-col overflow-hidden" ref={outerContainerRef}>
            <MemoNewChat
              subHeaders={subHeaders}
              toggleNav={toggleNavVisible}
              headerButtons={headerButtons}
              isSmallScreen={isSmallScreen}
            />
            <div className="flex min-h-0 flex-grow flex-col overflow-hidden">
              <Conversations
                conversations={conversations}
                moveToTop={moveToTop}
                toggleNav={itemToggleNav}
                containerRef={conversationsRef}
                loadMoreConversations={loadMoreConversations}
                isLoading={isFetchingNextPage || showLoading || isLoading}
                isSearchLoading={isSearchLoading}
                isChatsExpanded={isChatsExpanded}
                setIsChatsExpanded={setIsChatsExpanded}
              />
            </div>
          </div>
          {user && (
            <NavLink
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-black transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              svg={() => <UserIcon />}
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
                copied ? localize('com_ui_copied_success') : localize('com_ui_copy_invitation_link')
              }
              clickHandler={user ? copyLinkHandler : navigateToRegister}
            />
          )}
          <Suspense fallback={<Skeleton className="mt-1 h-12 w-full rounded-xl" />}>
            <AccountSettings />
          </Suspense>
        </nav>
      </div>
    );

    // Mobile: Fixed positioned sidebar that slides over content
    // Uses CSS transitions (not Framer Motion) to sync perfectly with content animation
    if (isSmallScreen) {
      return (
        <>
          <div
            data-testid="nav"
            className={cn(
              'nav fixed left-0 top-0 z-[70] h-full bg-surface-primary-alt',
              navVisible && 'active',
            )}
            style={{
              width: sidebarWidth,
              transform: navVisible ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            {sidebarContent}
          </div>
          <NavMask navVisible={navVisible} toggleNavVisible={toggleNavVisible} />
        </>
      );
    }

    // Desktop: Inline sidebar with width transition
    return (
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: navVisible ? sidebarWidth : 0, transition: 'width 0.2s ease-out' }}
      >
        <div
          data-testid="nav"
          className={cn('nav h-full bg-surface-primary-alt', navVisible && 'active')}
          style={{
            width: sidebarWidth,
            transform: navVisible ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          {sidebarContent}
        </div>
      </div>
    );
  },
);

Nav.displayName = 'Nav';

export default Nav;
