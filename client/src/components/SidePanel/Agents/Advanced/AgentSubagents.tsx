import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MAX_SUBAGENTS, EModelEndpoint } from 'librechat-data-provider';
import { X, PlusCircle, Users } from 'lucide-react';
import {
  Switch,
  HoverCard,
  CircleHelpIcon,
  HoverCardPortal,
  ControlCombobox,
  HoverCardContent,
  HoverCardTrigger,
} from '@librechat/client';
import type { TMessage } from 'librechat-data-provider';
import type { ControllerRenderProps } from 'react-hook-form';
import type { AgentForm, OptionWithIcon } from '~/common';
import MessageIcon from '~/components/Share/MessageIcon';
import { useAgentsMapContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { ESide } from '~/common';

interface AgentSubagentsProps {
  field: ControllerRenderProps<AgentForm, 'subagents'>;
  currentAgentId: string;
}

const AgentSubagents: React.FC<AgentSubagentsProps> = ({ field, currentAgentId }) => {
  const localize = useLocalize();
  const agentsMap = useAgentsMapContext();
  const [newAgentId, setNewAgentId] = useState('');

  const fieldValue = field.value;
  const value = useMemo(() => fieldValue ?? {}, [fieldValue]);
  const enabled = value.enabled === true;
  const allowSelf = value.allowSelf !== false;
  const agentIds = useMemo(() => value.agent_ids ?? [], [value.agent_ids]);

  const setEnabled = useCallback(
    (next: boolean) => {
      if (!next) {
        /**
         * Persist `{ enabled: false }` (with the existing selections preserved)
         * rather than `undefined`. The backend's `removeNullishValues` strips
         * undefined fields from PATCH payloads, so setting the whole object to
         * undefined would leave the server copy enabled. An explicit
         * `enabled: false` flows through as a real update.
         */
        field.onChange({
          enabled: false,
          allowSelf: value.allowSelf ?? true,
          agent_ids: value.agent_ids ?? [],
        });
        return;
      }
      field.onChange({
        enabled: true,
        allowSelf: value.allowSelf ?? true,
        agent_ids: value.agent_ids ?? [],
      });
    },
    [field, value.allowSelf, value.agent_ids],
  );

  const setAllowSelf = useCallback(
    (next: boolean) => {
      field.onChange({
        ...value,
        enabled: true,
        allowSelf: next,
      });
    },
    [field, value],
  );

  const setAgentIds = useCallback(
    (ids: string[]) => {
      field.onChange({
        ...value,
        enabled: true,
        allowSelf: value.allowSelf ?? true,
        agent_ids: ids,
      });
    },
    [field, value],
  );

  const agents = useMemo(() => (agentsMap ? Object.values(agentsMap) : []), [agentsMap]);

  const selectableAgents = useMemo<OptionWithIcon[]>(() => {
    const selectedSet = new Set(agentIds);
    return agents
      .filter((agent) => {
        if (!agent?.id) return false;
        if (agent.id === currentAgentId) return false;
        return !selectedSet.has(agent.id);
      })
      .map(
        (agent) =>
          ({
            label: agent?.name || '',
            value: agent?.id || '',
            icon: (
              <MessageIcon
                message={
                  {
                    endpoint: EModelEndpoint.agents,
                    isCreatedByUser: false,
                  } as TMessage
                }
                agent={agent}
              />
            ),
          }) as OptionWithIcon,
      );
  }, [agents, currentAgentId, agentIds]);

  const getAgentDetails = useCallback((id: string) => agentsMap?.[id], [agentsMap]);

  useEffect(() => {
    if (newAgentId && agentIds.length < MAX_SUBAGENTS && !agentIds.includes(newAgentId)) {
      setAgentIds([...agentIds, newAgentId]);
      setNewAgentId('');
    } else if (newAgentId) {
      setNewAgentId('');
    }
  }, [newAgentId, agentIds, setAgentIds]);

  const removeAgentAt = (index: number) => {
    setAgentIds(agentIds.filter((_, i) => i !== index));
  };

  const enableId = 'subagents-enable-toggle';
  const selfId = 'subagents-self-toggle';
  const nothingToSpawn = enabled && !allowSelf && agentIds.length === 0;

  return (
    <HoverCard openDelay={50}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor={enableId} className="text-text-primary font-semibold">
            {localize('com_ui_agent_subagents')}
          </label>
          <HoverCardTrigger>
            <CircleHelpIcon className="text-text-tertiary h-4 w-4" />
          </HoverCardTrigger>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-purple-600/40 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-700/10 dark:text-purple-400">
            {localize('com_ui_beta')}
          </div>
          <Switch
            id={enableId}
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label={localize('com_ui_agent_subagents_enable')}
          />
        </div>
      </div>

      {enabled && (
        <div className="mt-2 space-y-3">
          <div className="border-border-light bg-surface-primary flex items-center justify-between gap-2 rounded-md border p-3">
            <div className="flex flex-col">
              <label htmlFor={selfId} className="text-text-primary text-sm font-medium">
                {localize('com_ui_agent_subagents_allow_self')}
              </label>
              <span className="text-text-secondary text-xs">
                {localize('com_ui_agent_subagents_allow_self_info')}
              </span>
            </div>
            <Switch
              id={selfId}
              checked={allowSelf}
              onCheckedChange={setAllowSelf}
              aria-label={localize('com_ui_agent_subagents_allow_self')}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-secondary text-xs font-medium">
                {localize('com_ui_agent_subagents_agents')}
              </span>
              <span className="text-text-secondary text-xs">
                {agentIds.length} / {MAX_SUBAGENTS}
              </span>
            </div>

            {agentIds.map((agentId, idx) => {
              const details = getAgentDetails(agentId);
              return (
                <div
                  key={agentId}
                  className="border-border-medium bg-surface-tertiary flex h-9 items-center gap-2 rounded-md border pr-2 pl-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                    <MessageIcon
                      message={
                        {
                          endpoint: EModelEndpoint.agents,
                          isCreatedByUser: false,
                        } as TMessage
                      }
                      agent={details}
                    />
                  </div>
                  <div className="text-text-primary flex-1 truncate text-sm">
                    {details?.name ?? agentId}
                  </div>
                  <button
                    type="button"
                    className="hover:bg-surface-hover rounded-xl p-1 transition"
                    onClick={() => removeAgentAt(idx)}
                    aria-label={localize('com_ui_agent_subagents_remove', {
                      0: details?.name ?? agentId,
                    })}
                  >
                    <X size={18} className="text-text-secondary" aria-hidden="true" />
                  </button>
                </div>
              );
            })}

            {agentIds.length < MAX_SUBAGENTS && (
              <ControlCombobox
                isCollapsed={false}
                ariaLabel={localize('com_ui_agent_subagents_add')}
                selectedValue=""
                setValue={setNewAgentId}
                selectPlaceholder={localize('com_ui_agent_subagents_add')}
                searchPlaceholder={localize('com_ui_agent_var', { 0: localize('com_ui_search') })}
                items={selectableAgents}
                className="border-border-heavy text-text-secondary hover:text-text-primary h-9 w-full border-dashed text-center"
                containerClassName="px-0"
                SelectIcon={<PlusCircle size={16} className="text-text-secondary" />}
              />
            )}

            {agentIds.length >= MAX_SUBAGENTS && (
              <p className="text-text-tertiary pt-1 text-center text-xs italic">
                {localize('com_ui_agent_subagents_max', { 0: MAX_SUBAGENTS })}
              </p>
            )}
          </div>

          {nothingToSpawn && (
            <p className="flex items-center gap-2 text-xs text-amber-600 italic dark:text-amber-400">
              <Users size={14} aria-hidden="true" />
              {localize('com_ui_agent_subagents_empty')}
            </p>
          )}
        </div>
      )}

      <HoverCardPortal>
        <HoverCardContent side={ESide.Top} className="w-80">
          <div className="space-y-2">
            <p className="text-text-secondary text-sm">{localize('com_ui_agent_subagents_info')}</p>
            <p className="text-text-secondary text-sm">
              {localize('com_ui_agent_subagents_info_2')}
            </p>
          </div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
};

export default AgentSubagents;
