import { useState } from 'react';
import { Label } from '~/components/ui/Label';
import SelectDropDown from '../../../ui/SelectDropDown';
import EssayTemplate from './EssayTemplate';
import { cn } from '~/utils';
import { useRecoilState } from 'recoil';
import { MessagesSquared } from '~/components/svg';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';

import store from '~/store';

/*
作者职位、写作水平、字数、主题、布局、风格、引文、读者
https://www.griproom.com/fun/how-to-use-chat-gpt-to-write-an-essay
https://www.griproom.com/fun/how-to-write-better-prompts-for-chat-gpt
*/
function WritingAssistant() {
  const [type, setType] = useState<string>('作文');
  const [showExample, setShowExample] = useState<boolean>(false);
  // const [text, setText] = useRecoilState(store.text);
  const [text, setText] = useRecoilState(store.textByIndex(0));
  const [widget, setWidget] = useRecoilState(store.widget);
  const allTemplates = {
    作文: EssayTemplate({ type }),
  };
  const template = allTemplates[type];

  const defaultTextProps =
    'rounded-md border border-gray-200 focus:border-slate-400 focus:bg-gray-50 bg-transparent text-sm shadow-[0_0_10px_rgba(0,0,0,0.05)] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-gray-400 focus:ring-opacity-20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-700 focus:dark:bg-gray-600 dark:text-gray-50 dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] dark:focus:border-gray-400 dark:focus:outline-none dark:focus:ring-0 dark:focus:ring-gray-400 dark:focus:ring-offset-0';

  const getPromptText = template.getPromptText;
  const setExample = template.setExample;
  const restoreFields = template.restoreFields;

  const setTextHandler = () => {
    setText(getPromptText());
    setWidget(''); //close window
  };
  const showExampleHandler = () => {
    showExample ? restoreFields() : setExample();
    setShowExample(!showExample);
  };

  const content = () => {
    return (
      <div className="h-[60vh] max-h-[450px] overflow-y-auto pb-12 md:h-[450px]">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            <div className="grid w-full items-center gap-y-2">
              <SelectDropDown
                title={'写作类型'}
                value={type}
                setValue={(value: string) => setType(value)}
                availableValues={['作文']}
                disabled={false}
                className={cn(
                  defaultTextProps,
                  'flex w-full resize-none focus:outline-none focus:ring-0 focus:ring-opacity-0 focus:ring-offset-0',
                )}
                containerClassName="flex w-full resize-none"
                subContainerClassName=""
              />
              {template.SubType()}
            </div>
            {template.LayoutLeft()}
          </div>
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            {template.LayoutRight()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <EndpointOptionsPopover
      content={<div className="px-4 py-4">{content()}</div>}
      widget={true}
      visible={widget === 'wa'}
      saveAsPreset={setTextHandler}
      closePopover={() => setWidget('')}
      // switchToSimpleMode={() => {
      //   setWidget('');
      // }}
      additionalButton={{
        label: showExample ? '恢复' : '示例',
        buttonClass: '',
        handler: showExampleHandler,
        icon: <MessagesSquared className="mr-1 w-[14px]" />,
      }}
    />
  );
}

export default WritingAssistant;
