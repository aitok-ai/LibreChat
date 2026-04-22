import { useMemo, memo } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import supersub from 'remark-supersub';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { EditIcon, FileText, Check } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextareaAutosize, Button, TooltipAnchor } from '@librechat/client';
import type { PluggableList } from 'unified';
import { codeNoExecution } from '~/components/Chat/Messages/Content/MarkdownComponents';
import VariablesDropdown from './VariablesDropdown';
import { PromptVariableGfm } from './Markdown';
import { cn, langSubset } from '~/utils';
import { useLocalize } from '~/hooks';

type Props = {
  name: string;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

const PromptEditor: React.FC<Props> = ({ name, isEditing, setIsEditing }) => {
  const localize = useLocalize();
  const { control } = useFormContext();

  const EditorIcon = useMemo(() => {
    return isEditing ? Check : EditIcon;
  }, [isEditing]);

  const rehypePlugins: PluggableList = [
    [rehypeKatex],
    [
      rehypeHighlight,
      {
        detect: true,
        ignoreMissing: true,
        subset: langSubset,
      },
    ],
  ];

  return (
    <div className="flex max-h-[85vh] flex-col sm:max-h-[85vh]">
      <h2 className="sr-only">{localize('com_ui_control_bar')}</h2>
      <header className="border-border-medium flex items-center justify-between rounded-t-xl border bg-transparent px-2 py-1.5">
        <div className="ml-1 flex items-center gap-2">
          <FileText className="text-text-secondary size-4" aria-hidden="true" />
          <h3 className="text-text-primary text-sm font-semibold">
            {localize('com_ui_prompt_text')}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <VariablesDropdown fieldName={name} />
          <TooltipAnchor
            description={isEditing ? localize('com_ui_save') : localize('com_ui_edit')}
            render={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsEditing((prev) => !prev)}
                aria-label={isEditing ? localize('com_ui_save') : localize('com_ui_edit')}
                className="hover:bg-surface-tertiary size-8 p-0"
              >
                <EditorIcon className="text-text-secondary size-4" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </header>
      <div
        className={cn(
          'border-border-medium relative w-full flex-1 overflow-auto rounded-b-xl border border-t-0 p-3 text-left transition-all duration-200 sm:p-4',
          isEditing ? '' : 'hover:bg-surface-tertiary cursor-pointer',
        )}
      >
        {!isEditing && (
          <button
            type="button"
            aria-label={localize('com_ui_edit')}
            className="focus-visible:ring-ring-primary absolute inset-0 z-0 rounded-b-xl focus:outline-none focus-visible:ring-2"
            onClick={() => setIsEditing(true)}
          />
        )}
        <Controller
          name={name}
          control={control}
          render={({ field }) =>
            isEditing ? (
              <TextareaAutosize
                {...field}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="text-text-primary placeholder:text-text-tertiary focus-visible:ring-ring-primary w-full resize-none overflow-y-auto bg-transparent font-mono text-sm leading-relaxed focus:outline-none focus-visible:ring-2 sm:text-base"
                minRows={4}
                maxRows={16}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditing(false);
                  }
                }}
                placeholder={localize('com_ui_prompt_input')}
                aria-label={localize('com_ui_prompt_input')}
              />
            ) : (
              <div
                className="group/preview relative min-h-[6rem] overflow-y-auto text-sm sm:text-base"
                style={{ maxHeight: '24rem' }}
                onClick={() => setIsEditing(true)}
              >
                {!field.value ? (
                  <p className="text-text-tertiary italic">{localize('com_ui_click_to_edit')}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[
                      /** @ts-ignore */
                      supersub,
                      remarkGfm,
                      [remarkMath, { singleDollarTextMath: false }],
                    ]}
                    /** @ts-ignore */
                    rehypePlugins={rehypePlugins}
                    /** @ts-ignore */
                    components={{ p: PromptVariableGfm, code: codeNoExecution }}
                    className="markdown prose dark:prose-invert light text-text-primary w-full break-words"
                  >
                    {field.value}
                  </ReactMarkdown>
                )}
                <div className="pointer-events-none sticky bottom-1/2 z-10 flex translate-y-1/2 items-center justify-center opacity-0 transition-all duration-200 group-hover/preview:opacity-100">
                  <div className="border-border-light bg-surface-primary flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-md">
                    <EditIcon className="text-text-secondary size-4" aria-hidden="true" />
                    <span className="text-text-primary text-sm font-medium">
                      {localize('com_ui_click_to_edit')}
                    </span>
                  </div>
                </div>
              </div>
            )
          }
        />
      </div>
    </div>
  );
};

export default memo(PromptEditor);
