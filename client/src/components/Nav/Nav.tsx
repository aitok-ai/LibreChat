import {
  TConversation,
  useGetConversationsQuery,
  useSearchQuery,
  TSearchResults,
} from 'librechat-data-provider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import NewChat from './NewChat';
import SearchBar from './SearchBar';
import NavLinks from './NavLinks';
import { Panel, Spinner } from '~/components';
import { useAuthContext, useMediaQuery, useConversation, useConversations } from '~/hooks';
import { Conversations, Pages } from '../Conversations';
import NavToggle from './NavToggle';
import { cn } from '~/utils';
import store from '~/store';
import NavLink from './NavLink';
import CheckMark from '../svg/CheckMark';

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui/';
import Clipboard from '../svg/Clipboard';
import LeaderboardIcon from '../svg/LeaderboardIcon';
import NotebookIcon from '../svg/NotebookIcon';
import { useNavigate, useParams } from 'react-router-dom';
import HomeIcon from '../svg/HomeIcon';
import LightBulbIcon from '../svg/LightBulbIcon';
import ComputerIcon from '../svg/ComputerIcon';
import ProfileIcon from '../svg/UserIcon';
import { useLocalize } from '~/hooks';

export default function Nav({ navVisible, setNavVisible }) {
  const [isToggleHovering, setIsToggleHovering] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [navWidth, setNavWidth] = useState('260px');
  const { isAuthenticated } = useAuthContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef<number | null>(null);
  const localize = useLocalize();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isSmallScreen) {
      setNavWidth('320px');
    } else {
      setNavWidth('260px');
    }
  }, [isSmallScreen]);

  const [conversations, setConversations] = useState<TConversation[]>([]);
  // current page
  const [pageNumber, setPageNumber] = useState(1);
  // total pages
  const [pages, setPages] = useState(1);

  // data provider
  const getConversationsQuery = useGetConversationsQuery(pageNumber + '', {
    enabled: isAuthenticated,
  });

  // search
  const searchQuery = useRecoilValue(store.searchQuery);
  const isSearchEnabled = useRecoilValue(store.isSearchEnabled);
  const isSearching = useRecoilValue(store.isSearching);
  const { newConversation, searchPlaceholderConversation } = useConversation();

  // current conversation
  const conversation = useRecoilValue(store.conversation);
  const { conversationId } = conversation || {};
  const setSearchResultMessages = useSetRecoilState(store.searchResultMessages);
  const refreshConversationsHint = useRecoilValue(store.refreshConversationsHint);
  const { refreshConversations } = useConversations();

  const [isFetching, setIsFetching] = useState(false);

  const [refLink, setRefLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [widget, setWidget] = useRecoilState(store.widget);
  const { user } = useAuthContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const searchQueryFn = useSearchQuery(searchQuery, pageNumber + '', {
    enabled: !!(!!searchQuery && searchQuery.length > 0 && isSearchEnabled && isSearching),
  });

  const onSearchSuccess = useCallback((data: TSearchResults, expectedPage?: number) => {
    const res = data;
    setConversations(res.conversations);
    if (expectedPage) {
      setPageNumber(expectedPage);
    }
    setPages(Number(res.pages));
    setIsFetching(false);
    searchPlaceholderConversation();
    setSearchResultMessages(res.messages);
    /* disabled due recoil methods not recognized as state setters */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array

  useEffect(() => {
    //we use isInitialLoading here instead of isLoading because query is disabled by default
    if (searchQueryFn.isInitialLoading) {
      setIsFetching(true);
    } else if (searchQueryFn.data) {
      onSearchSuccess(searchQueryFn.data);
    }
  }, [searchQueryFn.data, searchQueryFn.isInitialLoading, onSearchSuccess]);

  const clearSearch = () => {
    setPageNumber(1);
    refreshConversations();
    if (conversationId == 'search') {
      newConversation();
    }
  };

  const moveToTop = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      scrollPositionRef.current = container.scrollTop;
    }
  }, [containerRef, scrollPositionRef]);

  const nextPage = async () => {
    moveToTop();
    setPageNumber(pageNumber + 1);
  };

  const previousPage = async () => {
    moveToTop();
    setPageNumber(pageNumber - 1);
  };

  useEffect(() => {
    if (getConversationsQuery.data) {
      if (isSearching) {
        return;
      }
      let { conversations, pages } = getConversationsQuery.data;
      pages = Number(pages);
      if (pageNumber > pages) {
        setPageNumber(pages);
      } else {
        if (!isSearching) {
          conversations = conversations.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }
        setConversations(conversations);
        setPages(pages);
      }
    }
  }, [getConversationsQuery.isSuccess, getConversationsQuery.data, isSearching, pageNumber]);

  useEffect(() => {
    if (!isSearching) {
      getConversationsQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, conversationId, refreshConversationsHint]);

  const toggleNavVisible = () => {
    setNavVisible((prev: boolean) => !prev);
  };

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
  const openProfileHandler = () => navigate(`/profile/${user.id}`);

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

  const itemToggleNav = () => {
    if (isSmallScreen) {
      toggleNavVisible();
    }
  };

  const containerClasses =
    getConversationsQuery.isLoading && pageNumber === 1
      ? 'flex flex-col gap-2 text-gray-100 text-sm h-full justify-center items-center'
      : 'flex flex-col gap-2 text-gray-100 text-sm';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <div
          className={
            'nav active dark max-w-[320px] flex-shrink-0 overflow-x-hidden bg-black md:max-w-[260px]'
          }
          style={{
            width: navVisible ? navWidth : '0px',
            visibility: navVisible ? 'visible' : 'hidden',
            transition: 'width 0.2s, visibility 0.2s',
          }}
        >
          <div className="h-full w-[320px] md:w-[260px]">
            <div className="flex h-full min-h-0 flex-col">
              <div
                className={cn(
                  'scrollbar-trigger relative flex h-full w-full flex-1 items-start border-white/20 transition-opacity',
                  isToggleHovering && !isSmallScreen ? 'opacity-50' : 'opacity-100',
                )}
              >
                <nav className="relative flex h-full flex-1 flex-col space-y-1 p-2">
                  <div className="mb-1 flex h-11 flex-row">
                    <NewChat toggleNav={itemToggleNav} />
                  </div>
                  {isSearchEnabled && <SearchBar clearSearch={clearSearch} />}
                  <div
                    className={`flex-1 flex-col overflow-y-auto ${
                      isHovering ? '' : 'scrollbar-transparent'
                    } border-b border-white/20`}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    ref={containerRef}
                  >
                    <div className={containerClasses}>
                      {(getConversationsQuery.isLoading && pageNumber === 1) || isFetching ? (
                        <Spinner />
                      ) : (
                        <Conversations
                          conversations={conversations}
                          moveToTop={moveToTop}
                          toggleNav={itemToggleNav}
                        />
                      )}
                      <Pages
                        pageNumber={pageNumber}
                        pages={pages}
                        nextPage={nextPage}
                        previousPage={previousPage}
                        setPageNumber={setPageNumber}
                      />
                    </div>
                  </div>
                  {user && (
                    <NavLink
                      className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                      // Add an SVG or icon for the Profile link here
                      svg={() => <ProfileIcon />}
                      text={localize('com_ui_homepage')}
                      clickHandler={openProfileHandler}
                    />
                  )}
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <HomeIcon />}
                    text={localize('com_ui_recommendation')}
                    clickHandler={user ? openHomepageHandler : navigateToRegister}
                  />
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <NotebookIcon />}
                    text={localize('com_ui_writing_assistant')}
                    clickHandler={user ? openWritingAssistantHandler : navigateToRegister}
                  />
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <ComputerIcon />}
                    text={localize('com_ui_coding_assistant')}
                    clickHandler={user ? openCodingAssistantHandler : navigateToRegister}
                  />
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <LightBulbIcon />}
                    text={localize('com_ui_ask_me_anything')}
                    clickHandler={user ? openAskMeAnythingHandler : navigateToRegister}
                  />
                  <NavLink
                    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                    svg={() => <LeaderboardIcon />}
                    text={localize('com_ui_referrals_leaderboard')}
                    clickHandler={user ? openLeaderboardHandler : navigateToRegister}
                  />
                  {/*{!window.location.hostname.match(/^(.*\.)?toatu\.com$/) && (*/}
                  {/*  <NavLink*/}
                  {/*    className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-3 text-sm text-white transition-colors duration-200 hover:bg-gray-700"*/}
                  {/*    svg={() => (copied ? <CheckMark /> : <Clipboard />)}*/}
                  {/*    text={*/}
                  {/*      copied*/}
                  {/*        ? localize('com_ui_copied_success')*/}
                  {/*        : localize('com_ui_copy_invitation_link')*/}
                  {/*    }*/}
                  {/*    clickHandler={user ? copyLinkHandler : navigateToRegister}*/}
                  {/*  />*/}
                  {/*)}*/}
                  <NavLinks />
                </nav>
              </div>
            </div>
          </div>
        </div>
        <NavToggle
          isHovering={isToggleHovering}
          setIsHovering={setIsToggleHovering}
          onToggle={toggleNavVisible}
          navVisible={navVisible}
        />
        <div className={`nav-mask${navVisible ? ' active' : ''}`} onClick={toggleNavVisible} />
      </Tooltip>
    </TooltipProvider>
  );
}
