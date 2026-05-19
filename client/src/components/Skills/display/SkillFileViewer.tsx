import React, { memo, useMemo, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Eye, Code, Copy, Check, FileText, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Spinner, TooltipAnchor, useToastContext } from '@librechat/client';
import { apiBaseUrl } from 'librechat-data-provider';
import { useGetSkillFileContentQuery } from '~/data-provider';
import SkillMarkdownRenderer from './SkillMarkdownRenderer';
import { parseFrontmatter } from '../utils';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface SkillFileViewerProps {
  skillId: string;
  relativePath: string;
}

const SKILL_MD_SKIP_KEYS = new Set(['name', 'description']);

function SkillFileViewer({ skillId, relativePath }: SkillFileViewerProps) {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data, isLoading, isError } = useGetSkillFileContentQuery(skillId, relativePath);
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  const isMarkdown = relativePath.endsWith('.md');
  const isImage = data?.mimeType?.startsWith('image/') ?? false;
  const isSkillMd = relativePath === 'SKILL.md';
  const isText = data != null && !data.isBinary && data.content != null;

  const rawUrl = useMemo(
    () =>
      `${apiBaseUrl()}/api/skills/${skillId}/files/${encodeURIComponent(relativePath)}?raw=true`,
    [skillId, relativePath],
  );

  const parsed = useMemo(() => {
    if (!isMarkdown || !data?.content) {
      return null;
    }
    return parseFrontmatter(data.content, isSkillMd ? SKILL_MD_SKIP_KEYS : undefined);
  }, [isMarkdown, isSkillMd, data?.content]);

  const handleCopy = useCallback(async () => {
    if (isCopied || !data?.content) {
      return;
    }
    try {
      await navigator.clipboard.writeText(data.content);
      setIsCopied(true);
      showToast({ message: localize('com_ui_copied_to_clipboard'), status: 'success' });
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
      copyTimeout.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast({ message: localize('com_ui_copy_failed'), status: 'error' });
    }
  }, [data?.content, isCopied, showToast, localize]);

  return (
    <div className="flex h-full flex-col">
      {/* Header — fixed h-10 prevents layout shift when toggle appears/disappears */}
      <div className="border-border-medium flex h-10 items-center gap-2 border-b px-4">
        <button
          type="button"
          onClick={() => navigate(`/skills/${skillId}`)}
          className="text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-md p-1 transition-colors"
          aria-label={localize('com_ui_back')}
        >
          <ArrowLeft className="size-4" />
        </button>
        <FileText className="text-text-secondary size-4 shrink-0" aria-hidden="true" />
        <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium">
          {data?.filename ?? relativePath}
        </span>

        {/* Actions — right side */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Copy (text files only) */}
          {isText && (
            <TooltipAnchor
              description={isCopied ? localize('com_ui_copied') : localize('com_ui_copy')}
              render={
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-md p-1 transition-colors"
                  aria-label={localize('com_ui_copy_to_clipboard')}
                >
                  {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              }
            />
          )}

          {/* View toggle (markdown only) */}
          {isMarkdown && isText && (
            <div
              role="group"
              className="bg-surface-tertiary inline-flex h-7 rounded-lg p-0.5 text-sm font-medium"
            >
              <button
                type="button"
                onClick={() => setViewMode('rendered')}
                className={cn(
                  'flex items-center justify-center rounded-md px-1.5 transition-colors',
                  viewMode === 'rendered'
                    ? 'bg-surface-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
                aria-pressed={viewMode === 'rendered'}
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('source')}
                className={cn(
                  'flex items-center justify-center rounded-md px-1.5 transition-colors',
                  viewMode === 'source'
                    ? 'bg-surface-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
                aria-pressed={viewMode === 'source'}
              >
                <Code className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content — fills remaining space */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="text-text-secondary size-6" />
          </div>
        )}

        {isError && (
          <div className="text-text-secondary flex flex-col items-center justify-center gap-2 py-12">
            <FileQuestion className="size-8" />
            <p className="text-sm">{localize('com_ui_skill_file_load_error')}</p>
          </div>
        )}

        {data && !isLoading && !isError && (
          <>
            {data.isBinary && isImage && (
              <img
                src={rawUrl}
                alt={data.filename}
                className="max-h-[600px] max-w-full rounded-lg object-contain"
              />
            )}

            {data.isBinary && !isImage && (
              <div className="text-text-secondary flex flex-col items-center justify-center gap-2 py-12">
                <FileQuestion className="size-8" />
                <p className="text-sm">{localize('com_ui_skill_file_binary')}</p>
                <a
                  href={rawUrl}
                  download
                  className="text-text-primary text-sm underline hover:no-underline"
                >
                  {localize('com_ui_skill_file_download')}
                </a>
              </div>
            )}

            {/* Markdown — frontmatter grid + rendered/source body */}
            {isText && isMarkdown && parsed && (
              <>
                {viewMode === 'rendered' && parsed.fields.length > 0 && (
                  <div className="mb-3 grid grid-cols-[max-content_1fr] items-baseline gap-x-8 gap-y-2">
                    {parsed.fields.map(({ key, value }) => (
                      <React.Fragment key={key}>
                        <span className="text-text-secondary text-xs capitalize">{key}</span>
                        <span className="text-text-primary text-sm">{value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {viewMode === 'rendered' ? (
                  <SkillMarkdownRenderer content={parsed.body} />
                ) : (
                  <pre className="text-text-primary font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {data.content}
                  </pre>
                )}
              </>
            )}

            {/* Non-markdown text */}
            {isText && !isMarkdown && (
              <pre className="text-text-primary font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {data.content}
              </pre>
            )}

            {/* Text file too large for JSON response — offer download */}
            {!data.isBinary && data.content == null && (
              <div className="text-text-secondary flex flex-col items-center justify-center gap-2 py-12">
                <FileText className="size-8" />
                <p className="text-sm">{localize('com_ui_skill_file_download')}</p>
                <a
                  href={rawUrl}
                  download
                  className="text-text-primary text-sm underline hover:no-underline"
                >
                  {localize('com_ui_skill_file_download')}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(SkillFileViewer);
