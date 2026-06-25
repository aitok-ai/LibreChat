import { memo, useState, useCallback, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRecoilState } from 'recoil';
import { useParams } from 'react-router-dom';
import { buildTree } from 'librechat-data-provider';
import { CalendarDays, Settings } from 'lucide-react';
import { useGetSharedMessages } from 'librechat-data-provider/react-query';
import {
  Spinner,
  Button,
  OGDialog,
  ThemeContext,
  OGDialogTitle,
  useMediaQuery,
  OGDialogHeader,
  OGDialogContent,
  OGDialogTrigger,
} from '@librechat/client';
import { ThemeSelector, LangSelector } from '~/components/Nav/SettingsTabs/General/Selectors';
import { ShareMessagesProvider } from './ShareMessagesProvider';
import { useGetSharedStartupConfig } from '~/data-provider';
import { ShareArtifactsContainer } from './ShareArtifacts';
import { useLocalize, useDocumentTitle } from '~/hooks';
import { ShareContext } from '~/Providers';
import MessagesView from './MessagesView';
import Footer from '../Chat/Footer';
import { cn } from '~/utils';
import store from '~/store';

function SharedView() {
  const localize = useLocalize();
  const { theme, setTheme } = useContext(ThemeContext);
  const { shareId } = useParams();
  const { data: config } = useGetSharedStartupConfig(shareId);
  const { data, isLoading } = useGetSharedMessages(shareId ?? '');
  const dataTree = data && buildTree({ messages: data.messages });
  const messagesTree = dataTree?.length === 0 ? null : (dataTree ?? null);

  const [langcode, setLangcode] = useRecoilState(store.lang);
  const [viewCount, setViewCount] = useState<number>(0);

  // configure document title
  let docTitle = '';
  if (config?.appTitle != null && data?.title != null) {
    docTitle = `${data.title} | ${config.appTitle}`;
  } else {
    docTitle = data?.title ?? config?.appTitle ?? document.title;
  }

  useDocumentTitle(docTitle);

  // increase view count when shared link is opened
  useEffect(() => {
    if (data?.realConversationId) {
      fetch(`/api/convos/${data.realConversationId}/viewcount/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          if (response.ok) {
            const result = await response.json();
            setViewCount(result?.viewCount ?? 0);
          }
        })
        .catch((error) => {
          console.error('Error incrementing view count:', error);
        });
    }
  }, [data?.realConversationId]);

  const locale =
    langcode ||
    (typeof navigator !== 'undefined'
      ? navigator.language || navigator.languages?.[0] || 'en-US'
      : 'en-US');

  const formattedDate =
    data?.createdAt != null
      ? new Date(data.createdAt).toLocaleDateString(locale, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme],
  );

  const handleLangChange = useCallback(
    (value: string) => {
      let userLang = value;
      if (value === 'auto') {
        userLang =
          (typeof navigator !== 'undefined'
            ? navigator.language || navigator.languages?.[0]
            : null) ?? 'en-US';
      }

      setLangcode(userLang);
      Cookies.set('lang', userLang, { expires: 365 });
    },
    [setLangcode],
  );

  let content: JSX.Element;
  if (isLoading) {
    content = (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="" />
      </div>
    );
  } else if (data && messagesTree && messagesTree.length !== 0) {
    content = (
      <>
        <ShareHeader
          title={data.title}
          formattedDate={formattedDate}
          viewCount={viewCount}
          theme={theme}
          langcode={langcode}
          onThemeChange={handleThemeChange}
          onLangChange={handleLangChange}
          settingsLabel={localize('com_nav_settings')}
        />
        <ShareMessagesProvider messages={data.messages}>
          <MessagesView messagesTree={messagesTree} conversationId="shared-conversation" />
        </ShareMessagesProvider>
      </>
    );
  } else {
    content = (
      <div className="flex h-screen items-center justify-center">
        {localize('com_ui_shared_link_not_found')}
      </div>
    );
  }

  const footer = (
    <div className="from-surface-secondary pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-40% to-transparent">
      <Footer
        startupConfig={config ?? null}
        className="text-text-secondary pointer-events-auto relative mx-auto flex max-w-[55rem] flex-wrap items-center justify-center gap-2 px-3 pt-6 pb-4 text-center text-xs"
      />
    </div>
  );

  const mainContent = (
    <div className="transition-width dark:bg-surface-secondary relative flex h-full w-full flex-1 flex-col items-stretch overflow-hidden pt-0">
      <div className="text-text-primary relative flex h-full min-h-0 flex-col" role="presentation">
        {content}
        {footer}
      </div>
    </div>
  );

  const artifactsContainer =
    data && data.messages ? (
      <ShareArtifactsContainer
        messages={data.messages}
        conversationId={data.conversationId}
        mainContent={mainContent}
      />
    ) : (
      mainContent
    );

  return (
    <ShareContext.Provider value={{ isSharedConvo: true, shareId }}>
      <div className="dark:bg-surface-secondary relative flex h-screen w-full overflow-hidden">
        <main className="dark:bg-surface-secondary relative flex w-full grow overflow-hidden">
          {artifactsContainer}
        </main>
      </div>
    </ShareContext.Provider>
  );
}

interface ShareHeaderProps {
  title?: string;
  formattedDate: string | null;
  viewCount: number;
  theme: string;
  langcode: string;
  settingsLabel: string;
  onThemeChange: (value: string) => void;
  onLangChange: (value: string) => void;
}

function ShareHeader({
  title,
  formattedDate,
  viewCount,
  theme,
  langcode,
  settingsLabel,
  onThemeChange,
  onLangChange,
}: ShareHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const localize = useLocalize();

  const handleDialogOutside = useCallback((event: Event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-dialog-ignore="true"]')) {
      event.preventDefault();
    }
  }, []);

  return (
    <section className="mx-auto w-full px-2 pt-4 pb-3 md:px-5 md:pt-6 md:pb-4">
      <div className="bg-surface-primary/80 border-border-light relative mx-auto flex w-full max-w-[60rem] flex-col gap-3 rounded-2xl border px-4 py-4 shadow-xl backdrop-blur md:gap-4 md:rounded-3xl md:px-6 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-1.5 md:space-y-2">
            <h1 className="text-text-primary line-clamp-2 text-2xl font-semibold break-words md:text-4xl">
              {title}
            </h1>
            {formattedDate && (
              <div className="text-text-secondary flex items-center gap-2 text-sm">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span>{formattedDate}</span>
              </div>
            )}
            <div className="text-text-secondary flex items-center gap-2 text-sm">
              {localize('com_ui_number_of_views', { 0: viewCount.toString() })}
            </div>
          </div>

          <OGDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <OGDialogTrigger asChild>
              <Button
                size={isMobile ? 'icon' : 'default'}
                type="button"
                variant="outline"
                aria-label={settingsLabel}
                className={cn(
                  'border-border-medium text-text-primary rounded-full text-sm transition-colors',
                  isMobile
                    ? 'absolute right-4 bottom-4 justify-center p-0 shadow-lg'
                    : 'gap-2 self-start px-4 py-2',
                )}
              >
                <Settings className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">{settingsLabel}</span>
              </Button>
            </OGDialogTrigger>
            <OGDialogContent
              className="w-11/12 max-w-lg"
              showCloseButton={true}
              onPointerDownOutside={handleDialogOutside}
              onInteractOutside={handleDialogOutside}
            >
              <OGDialogHeader className="text-left">
                <OGDialogTitle>{settingsLabel}</OGDialogTitle>
              </OGDialogHeader>
              <div className="flex flex-col gap-4 pt-2 text-sm">
                <div className="relative focus-within:z-[100]">
                  <ThemeSelector theme={theme} onChange={onThemeChange} portal={false} />
                </div>
                <div className="bg-border-medium/60 h-px w-full" />
                <div className="relative focus-within:z-[100]">
                  <LangSelector langcode={langcode} onChange={onLangChange} portal={false} />
                </div>
              </div>
            </OGDialogContent>
          </OGDialog>
        </div>
      </div>
    </section>
  );
}

export default memo(SharedView);
