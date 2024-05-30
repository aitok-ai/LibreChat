import { useEffect, useState } from 'react';
import { Label, SelectDropDown } from '~/components/ui';
import { cn } from '~/utils';
import { MessagesSquared } from '~/components/svg';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import TextareaAutosize from 'react-textarea-autosize';
import store from '~/store';

type Cache = {
  type: string;
  topic: string;
  otherTypes: string;
};

function AskMeAnything() {
  const [type, setType] = useState<string>('知识');
  const [otherTypes, setOtherTypes] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [showExample, setShowExample] = useState<boolean>(false);
  const [widget, setWidget] = useRecoilState(store.widget);
  // const [text, setText] = useRecoilState(store.text);
  const [text, setText] = useRecoilState(store.textByIndex(0));
  const [cache, setCache] = useState<Cache>({
    type: '',
    topic: '',
    otherTypes: '',
  });

  const defaultTextProps =
    'rounded-md border border-gray-200 focus:border-slate-400 focus:bg-gray-50 bg-transparent text-sm shadow-[0_0_10px_rgba(0,0,0,0.05)] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-gray-400 focus:ring-opacity-20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-700 focus:dark:bg-gray-600 dark:text-gray-50 dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] dark:focus:border-gray-400 dark:focus:outline-none dark:focus:ring-0 dark:focus:ring-gray-400 dark:focus:ring-offset-0';

  const setTextHandler = () => {
    setText(`咨询一个${type === '其他' ? otherTypes : type}类的问题：${topic}`);
    setWidget(''); //close window
  };
  const showExampleHandler = () => {
    if (showExample) {
      setType(cache.type);
      setTopic(cache.topic);
      setOtherTypes(cache.otherTypes);
    } else {
      setCache({
        type: type,
        topic: topic,
        otherTypes: otherTypes,
      });
      setType('情感');
      setTopic('我跟一个女孩分离8年了。我最近获得了她的联系方式，我该怎么约她出来才不显得唐突？');
    }
    setShowExample(!showExample);
  };

  const content = () => {
    return (
      <div className="h-[60vh] max-h-[450px] overflow-y-auto pb-12 md:h-[450px]">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            <div className="grid w-full items-center gap-y-2">
              <SelectDropDown
                title={'类型'}
                value={type}
                setValue={(value: string) => setType(value)}
                availableValues={[
                  '知识',
                  '情感',
                  '工作',
                  '学习',
                  '娱乐',
                  '美食',
                  '生活',
                  '投资',
                  '育儿',
                  '保健',
                  '医生',
                  '旅行',
                  '购物',
                  '健身',
                  '其他',
                ]}
                disabled={false}
                className={cn(
                  defaultTextProps,
                  'flex w-full resize-none focus:outline-none focus:ring-0 focus:ring-opacity-0 focus:ring-offset-0',
                )}
                containerClassName="flex w-full resize-none"
                subContainerClassName=""
              />
              {type === '其他' && (
                <TextareaAutosize
                  id="topic"
                  title={'输入问题类型'}
                  placeholder="输入问题类型"
                  disabled={false}
                  value={otherTypes || ''}
                  onChange={(e) => setOtherTypes(e.target.value || '')}
                  className={cn(
                    defaultTextProps,
                    'flex max-h-[300px] min-h-[25px] w-full resize-none px-3 py-2',
                  )}
                />
              )}
            </div>
          </div>
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            <div className="grid w-full items-center gap-1">
              <Label htmlFor="context" className="text-left text-sm font-medium">
                问题
              </Label>
              <TextareaAutosize
                id="topic"
                title={'问题'}
                disabled={false}
                value={topic || ''}
                onChange={(e) => setTopic(e.target.value || '')}
                className={cn(
                  defaultTextProps,
                  'flex max-h-[300px] min-h-[100px] w-full resize-none px-3 py-2',
                )}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <EndpointOptionsPopover
      content={<div className="px-4 py-4">{content()}</div>}
      widget={true}
      visible={widget === 'ama'}
      saveAsPreset={setTextHandler}
      closePopover={() => setWidget('')}
      // switchToSimpleMode={() => {
      //   setWidget('');
      // }}
      additionalButton={{
        label: showExample ? '恢复' : '示例',
        handler: showExampleHandler,
        buttonClass: '',
        icon: <MessagesSquared className="mr-1 w-[14px]" />,
      }}
    />
  );
}

export default AskMeAnything;
