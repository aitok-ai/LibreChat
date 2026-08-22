import { Button, TextareaAutosize } from '@librechat/client';
import { Check, ChevronUp, TriangleAlert } from 'lucide-react';
import type { Agents } from 'librechat-data-provider';
import useAskQuestionsForm from '~/hooks/Input/useAskQuestionsForm';
import { splitOtherOption } from '~/utils/approval';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function AskUserQuestions({
  actionId,
  questions,
  className,
  onExpand,
}: {
  actionId: string;
  questions: Agents.AskUserQuestionBatchItem[];
  className?: string;
  onExpand?: () => void;
}) {
  const localize = useLocalize();
  const form = useAskQuestionsForm(actionId, questions);

  if (form.status === 'submitted') {
    return null;
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {onExpand != null && (
        <div className="border-border-light flex shrink-0 justify-end border-b px-2 py-1">
          <button
            type="button"
            aria-label={localize('com_ui_expand')}
            className="text-text-secondary hover:bg-surface-hover rounded p-1"
            onClick={onExpand}
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {questions.map((question, questionIndex) => {
          const { choices, otherLabel } = splitOtherOption(question.options);
          const selected = Object.hasOwn(form.state.selected, question.id)
            ? form.state.selected[question.id]
            : [];
          const text = Object.hasOwn(form.state.text, question.id)
            ? form.state.text[question.id]
            : '';
          return (
            <fieldset
              key={question.id}
              className={cn('py-3', questionIndex > 0 && 'border-border-light border-t')}
            >
              <legend className="text-text-secondary mb-1 text-xs font-medium">
                {question.header ?? localize('com_ui_question_number', { 0: questionIndex + 1 })}
              </legend>
              <p className="text-text-primary text-sm font-medium [overflow-wrap:anywhere]">
                {question.question}
              </p>
              {question.description != null && question.description.length > 0 && (
                <p className="text-text-secondary mt-1 text-xs [overflow-wrap:anywhere]">
                  {question.description}
                </p>
              )}
              {choices.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2" role="group">
                  {choices.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'submit' : 'outline'}
                        role={question.multiSelect === true ? 'checkbox' : undefined}
                        aria-checked={question.multiSelect === true ? isSelected : undefined}
                        aria-pressed={question.multiSelect === true ? undefined : isSelected}
                        disabled={form.locked}
                        className="h-auto min-h-9 max-w-full py-1.5 text-left [overflow-wrap:anywhere] whitespace-normal"
                        onClick={() => form.selectOption(question, option.value)}
                      >
                        {question.multiSelect === true && isSelected && (
                          <Check className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              )}
              <TextareaAutosize
                value={text}
                disabled={form.locked}
                onChange={(event) => form.setText(question, event.target.value)}
                minRows={1}
                maxRows={6}
                placeholder={otherLabel ?? localize('com_ui_your_answer')}
                className="border-border-light bg-surface-primary text-text-primary mt-2 w-full resize-none rounded-md border p-2 text-sm"
                aria-label={`${question.question} ${localize('com_ui_your_answer')}`}
              />
            </fieldset>
          );
        })}
      </div>
      {(form.status === 'error' || form.status === 'expired') && (
        <div className="text-text-warning flex items-center gap-1.5 px-3 py-1 text-xs">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {form.status === 'expired'
            ? localize('com_ui_approval_expired')
            : localize('com_ui_ask_answer_error')}
        </div>
      )}
      <div className="border-border-light flex shrink-0 justify-end gap-2 border-t p-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={form.locked}
          onClick={form.skip}
        >
          {localize('com_ui_skip')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="submit"
          disabled={!form.canSubmit}
          onClick={form.submit}
        >
          {form.status === 'submitting' ? localize('com_ui_submitting') : localize('com_ui_submit')}
        </Button>
      </div>
    </div>
  );
}
