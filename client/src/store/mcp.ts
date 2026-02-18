import { atom } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { Constants, LocalStorageKeys } from 'librechat-data-provider';
import { createTabIsolatedStorage } from './jotai-utils';

/**
 * Tab-isolated storage for MCP values — prevents cross-tab sync so that
 * each tab's MCP server selections are independent (especially for new chats
 * which all share the same `LAST_MCP_new` localStorage key).
 */
const mcpTabIsolatedStorage = createTabIsolatedStorage<string[]>();

/**
 * Creates a storage atom for MCP values per conversation
 * Uses atomFamily to create unique atoms for each conversation ID
 */
export const mcpValuesAtomFamily = atomFamily((conversationId: string | null) => {
  const key = conversationId ?? Constants.NEW_CONVO;
  const storageKey = `${LocalStorageKeys.LAST_MCP_}${key}`;

  return atomWithStorage<string[]>(storageKey, [], mcpTabIsolatedStorage, { getOnInit: true });
});

/**
 * Global storage atom for MCP pinned state (shared across all conversations)
 */
const MCP_PIN_STORAGE_KEY = `${LocalStorageKeys.LAST_MCP_TOGGLE_ ?? 'LAST_MCP_TOGGLE_'}pinned`;
export const mcpPinnedAtom = atomWithStorage<boolean>(MCP_PIN_STORAGE_KEY, true, undefined, {
  getOnInit: true,
});

/**
 * Server initialization state - shared globally so chat dropdown and settings panel
 * both see the same OAuth/initialization state.
 *
 * This enables canceling OAuth from either location.
 */
export interface MCPServerInitState {
  isInitializing: boolean;
  isCancellable: boolean;
  oauthUrl: string | null;
  oauthStartTime: number | null;
}

const defaultServerInitState: MCPServerInitState = {
  isInitializing: false,
  isCancellable: false,
  oauthUrl: null,
  oauthStartTime: null,
};

/**
 * Global atom for MCP server initialization states.
 * Keyed by server name.
 */
export const mcpServerInitStatesAtom = atom<Record<string, MCPServerInitState>>({});

/**
 * Helper to get or create a server's init state
 */
export const getServerInitState = (
  states: Record<string, MCPServerInitState>,
  serverName: string,
): MCPServerInitState => {
  return states[serverName] || defaultServerInitState;
};
