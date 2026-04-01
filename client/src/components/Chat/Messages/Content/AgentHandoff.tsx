import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { EModelEndpoint, Constants } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import MessageIcon from '~/components/Share/MessageIcon';
import { useLocalize, useExpandCollapse } from '~/hooks';
import { useAgentsMapContext } from '~/Providers';
import { cn } from '~/utils';

interface AgentHandoffProps {
  name: string;
  args: string | Record<string, unknown>;
}

const AgentHandoff: React.FC<AgentHandoffProps> = ({ name, args: _args = '' }) => {
  const localize = useLocalize();
  const agentsMap = useAgentsMapContext();
  const [showInfo, setShowInfo] = useState(false);
  const { style: expandStyle, ref: expandRef } = useExpandCollapse(showInfo);

  const targetAgentId = useMemo(() => {
    if (typeof name !== 'string' || !name.startsWith(Constants.LC_TRANSFER_TO_)) {
      return null;
    }
    return name.replace(Constants.LC_TRANSFER_TO_, '');
  }, [name]);

  const targetAgent = useMemo(() => {
    if (!targetAgentId || !agentsMap) {
      return null;
    }
    return agentsMap[targetAgentId];
  }, [agentsMap, targetAgentId]);

  const args = useMemo(() => {
    if (typeof _args === 'string') {
      return _args;
    }
    try {
      return JSON.stringify(_args, null, 2);
    } catch {
      return '';
    }
  }, [_args]) as string;

  const hasInfo = useMemo(() => (args?.trim()?.length ?? 0) > 2, [args]);

  return (
    <div className="my-1">
      <button
        type="button"
        className={cn(
          'tool-status-text text-text-secondary flex appearance-none items-center gap-2.5 bg-transparent',
          hasInfo
            ? 'hover:text-text-primary focus-visible:ring-border-heavy transition-colors focus-visible:ring-2 focus-visible:outline-none'
            : 'pointer-events-none',
        )}
        disabled={!hasInfo}
        onClick={hasInfo ? () => setShowInfo(!showInfo) : undefined}
        aria-expanded={hasInfo ? showInfo : undefined}
        aria-label={`${localize('com_ui_transferred_to')} ${targetAgent?.name || localize('com_ui_agent')}`}
      >
        <div className="ring-border-light flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-1">
          <MessageIcon
            message={
              {
                endpoint: EModelEndpoint.agents,
                isCreatedByUser: false,
              } as TMessage
            }
            agent={targetAgent || undefined}
          />
        </div>
        <span className="select-none">{localize('com_ui_transferred_to')}</span>
        <span className="text-text-primary font-medium select-none">
          {targetAgent?.name || localize('com_ui_agent')}
        </span>
        {hasInfo && (
          <ChevronDown
            className={cn('ml-1 h-3 w-3 transition-transform', showInfo && 'rotate-180')}
            aria-hidden="true"
          />
        )}
      </button>
      <div style={expandStyle}>
        <div className="overflow-hidden" ref={expandRef}>
          {hasInfo && (
            <div className="border-border-light bg-surface-secondary mt-2 ml-8 rounded-lg border p-3 text-xs">
              <div className="text-text-secondary mb-1 font-medium">
                {localize('com_ui_handoff_instructions')}:
              </div>
              <pre className="text-text-primary overflow-x-auto whitespace-pre-wrap">{args}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentHandoff;
