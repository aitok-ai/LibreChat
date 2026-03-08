import React, { ReactNode } from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronDown, Paperclip } from 'lucide-react';
import { VisuallyHidden } from '@ariakit/react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export interface SourceData {
  link: string;
  title?: string;
  attribution?: string;
  snippet?: string;
}

interface SourceHovercardProps {
  source: SourceData;
  label: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  isFile?: boolean;
  isLocalFile?: boolean;
  children?: ReactNode;
}

/** Helper to get domain favicon */
function getFaviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/** Helper to get clean domain name */
export function getCleanDomain(url: string) {
  const domain = url.replace(/(^\w+:|^)\/\//, '').split('/')[0];
  return domain.startsWith('www.') ? domain.substring(4) : domain;
}

export function FaviconImage({ domain, className = '' }: { domain: string; className?: string }) {
  return (
    <div className={cn('relative size-4 flex-shrink-0 overflow-hidden rounded-full', className)}>
      <div className="absolute inset-0 rounded-full bg-white" />
      <img src={getFaviconUrl(domain)} alt={domain} className="relative size-full" />
      <div className="border-border-light/10 absolute inset-0 rounded-full border dark:border-transparent"></div>
    </div>
  );
}

export function SourceHovercard({
  source,
  label,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isFile = false,
  isLocalFile = false,
  children,
}: SourceHovercardProps) {
  const localize = useLocalize();
  const domain = getCleanDomain(source.link || '');

  return (
    <span className="relative ml-0.5 inline-block">
      <Ariakit.HovercardProvider showTimeout={150} hideTimeout={150}>
        <span className="flex items-center">
          <Ariakit.HovercardAnchor
            render={
              isFile ? (
                <button
                  onClick={onClick}
                  className="border-border-heavy bg-surface-secondary hover:bg-surface-hover dark:border-border-medium dark:hover:bg-surface-tertiary ml-1 inline-block h-5 max-w-36 cursor-pointer items-center overflow-hidden rounded-xl border px-2 text-xs font-medium text-ellipsis whitespace-nowrap text-blue-600 no-underline transition-colors dark:text-blue-400"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  title={
                    isLocalFile ? localize('com_sources_download_local_unavailable') : undefined
                  }
                >
                  {label}
                </button>
              ) : (
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border-heavy bg-surface-secondary hover:bg-surface-hover dark:border-border-medium dark:hover:bg-surface-tertiary ml-1 inline-block h-5 max-w-36 cursor-pointer items-center overflow-hidden rounded-xl border px-2 text-xs font-medium text-ellipsis whitespace-nowrap no-underline transition-colors"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  {label}
                </a>
              )
            }
          />
          <Ariakit.HovercardDisclosure className="text-text-primary focus:ring-ring ml-0.5 rounded-full focus:ring-2 focus:outline-none">
            <VisuallyHidden>{localize('com_citation_more_details', { label })}</VisuallyHidden>
            <ChevronDown className="icon-sm" aria-hidden="true" />
          </Ariakit.HovercardDisclosure>

          <Ariakit.Hovercard
            gutter={16}
            className="dark:shadow-lg-dark border-border-medium bg-surface-secondary text-text-primary z-[999] w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border p-3 shadow-lg"
            portal={true}
            unmountOnHide={true}
          >
            {children}
            {!children && (
              <>
                <span className="mb-2 flex items-center">
                  {isFile ? (
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      <Paperclip className="text-text-secondary h-3 w-3" />
                    </div>
                  ) : (
                    <FaviconImage domain={domain} className="mr-2" />
                  )}
                  {isFile ? (
                    <button
                      onClick={onClick}
                      className="line-clamp-2 cursor-pointer overflow-hidden text-left text-sm font-bold text-[#0066cc] hover:underline md:line-clamp-3 dark:text-blue-400"
                    >
                      {source.attribution || source.title || localize('com_file_source')}
                    </button>
                  ) : (
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 cursor-pointer overflow-hidden text-sm font-bold text-[#0066cc] hover:underline md:line-clamp-3 dark:text-blue-400"
                    >
                      {source.attribution || domain}
                    </a>
                  )}
                </span>

                {isFile ? (
                  <>
                    {source.snippet && (
                      <span className="text-text-secondary my-2 text-xs break-all text-ellipsis md:text-sm">
                        {source.snippet}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="text-text-primary mt-0 mb-1.5 text-xs md:text-sm">
                      {source.title || source.link}
                    </h4>
                    {source.snippet && (
                      <span className="text-text-secondary my-2 text-xs break-all text-ellipsis md:text-sm">
                        {source.snippet}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </Ariakit.Hovercard>
        </span>
      </Ariakit.HovercardProvider>
    </span>
  );
}
