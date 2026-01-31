import { useCallback, useEffect, useMemo } from 'react';
import { useAtom } from 'jotai';
import isEqual from 'lodash/isEqual';
import { useRecoilState } from 'recoil';
import { Constants, LocalStorageKeys } from 'librechat-data-provider';
import { ephemeralAgentByConvoId, mcpValuesAtomFamily } from '~/store';
import { setTimestamp } from '~/utils/timestamps';
import useLocalStorage from '~/hooks/useLocalStorageAlt';
import { MCPServerDefinition } from './useMCPServerManager';

export function useMCPSelect({
  conversationId,
  servers,
}: {
  conversationId?: string | null;
  servers: MCPServerDefinition[];
}) {
  const key = conversationId ?? Constants.NEW_CONVO;
  const configuredServers = useMemo(() => {
    return new Set(servers?.map((s) => s.serverName));
  }, [servers]);

  const mcpPinnedKey = useMemo(
    () => `${LocalStorageKeys.LAST_MCP_TOGGLE_ ?? 'LAST_MCP_TOGGLE_'}pinned`,
    [],
  );
  const [isPinned, setIsPinned] = useLocalStorage<boolean>(mcpPinnedKey, true);
  const [mcpValues, setMCPValuesRaw] = useAtom(mcpValuesAtomFamily(key));
  const [ephemeralAgent, setEphemeralAgent] = useRecoilState(ephemeralAgentByConvoId(key));

  useEffect(() => {
    const legacyPinned = localStorage.getItem(LocalStorageKeys.PIN_MCP_);
    const currentPinned = localStorage.getItem(mcpPinnedKey);
    if (legacyPinned != null && currentPinned == null) {
      try {
        setIsPinned(JSON.parse(legacyPinned));
      } catch (error) {
        console.error(error);
      }
    }
  }, [mcpPinnedKey, setIsPinned]);

  // Sync Jotai state with ephemeral agent state
  useEffect(() => {
    const mcps = ephemeralAgent?.mcp ?? [];
    if (mcps.length === 1 && mcps[0] === Constants.mcp_clear) {
      setMCPValuesRaw([]);
    } else if (mcps.length > 0) {
      // Strip out servers that are not available in the startup config
      const activeMcps = mcps.filter((mcp) => configuredServers.has(mcp));
      setMCPValuesRaw(activeMcps);
    }
  }, [ephemeralAgent?.mcp, setMCPValuesRaw, configuredServers]);

  useEffect(() => {
    setEphemeralAgent((prev) => {
      if (!isEqual(prev?.mcp, mcpValues)) {
        return { ...(prev ?? {}), mcp: mcpValues };
      }
      return prev;
    });
  }, [mcpValues, setEphemeralAgent]);

  useEffect(() => {
    const mcpStorageKey = `${LocalStorageKeys.LAST_MCP_}${key}`;
    if (mcpValues.length > 0) {
      setTimestamp(mcpStorageKey);
    }
  }, [mcpValues, key]);

  /** Stable memoized setter */
  const setMCPValues = useCallback(
    (value: string[]) => {
      if (!Array.isArray(value)) {
        return;
      }
      setMCPValuesRaw(value);
    },
    [setMCPValuesRaw],
  );

  return {
    isPinned,
    mcpValues,
    setIsPinned,
    setMCPValues,
  };
}
