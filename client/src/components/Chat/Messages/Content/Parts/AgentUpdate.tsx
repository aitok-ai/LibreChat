import React, { useMemo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import MessageIcon from '~/components/Share/MessageIcon';
import { useAgentsMapContext } from '~/Providers';
import { useLocalize } from '~/hooks';

interface AgentUpdateProps {
  currentAgentId: string;
}

const AgentUpdate: React.FC<AgentUpdateProps> = ({ currentAgentId }) => {
  const localize = useLocalize();
  const agentsMap = useAgentsMapContext();
  const currentAgent = useMemo(() => agentsMap?.[currentAgentId], [agentsMap, currentAgentId]);
  if (!currentAgentId) {
    return null;
  }
  return (
    <div className="relative">
      <div className="absolute -left-6 flex h-full w-4 items-center justify-center">
        <div className="relative h-full w-4">
          <div className="border-border-medium absolute top-0 left-0 h-1/2 w-px border"></div>
          <div className="border-border-medium absolute top-1/2 left-0 h-px w-3 border"></div>
        </div>
      </div>
      <div className="my-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
          <MessageIcon
            message={
              {
                endpoint: EModelEndpoint.agents,
                isCreatedByUser: false,
              } as TMessage
            }
            agent={currentAgent}
          />
        </div>
        <div className="text-text-primary text-base font-medium">
          {currentAgent?.name || localize('com_ui_agent')}
        </div>
      </div>
    </div>
  );
};

export default AgentUpdate;
