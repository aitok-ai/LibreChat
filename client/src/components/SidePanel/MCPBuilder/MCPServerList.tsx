import { MCPIcon } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type { MCPServerStatusIconProps } from '~/components/MCP/MCPServerStatusIcon';
import type { MCPServerDefinition } from '~/hooks';
import { useLocalize, useHasAccess } from '~/hooks';
import MCPServerCard from './MCPServerCard';

interface MCPServerListProps {
  servers: MCPServerDefinition[];
  getServerStatusIconProps: (serverName: string) => MCPServerStatusIconProps;
  isFiltered?: boolean;
}

/**
 * Renders a list of MCP server cards with empty state handling
 */
export default function MCPServerList({
  servers,
  getServerStatusIconProps,
  isFiltered = false,
}: MCPServerListProps) {
  const localize = useLocalize();
  const canCreateEditMCPs = useHasAccess({
    permissionType: PermissionTypes.MCP_SERVERS,
    permission: Permissions.CREATE,
  });

  if (servers.length === 0) {
    return (
      <div className="border-border-light flex flex-col items-center justify-center rounded-lg border bg-transparent p-6 text-center">
        <div className="bg-surface-tertiary mb-2 flex size-10 items-center justify-center rounded-full">
          <MCPIcon className="text-text-secondary size-5" aria-hidden="true" />
        </div>
        {isFiltered ? (
          <p className="text-text-secondary text-sm">{localize('com_ui_no_mcp_servers_match')}</p>
        ) : (
          <>
            <p className="text-text-primary text-sm font-medium">
              {localize('com_ui_no_mcp_servers')}
            </p>
            <p className="text-text-secondary mt-0.5 text-xs">
              {localize('com_ui_add_first_mcp_server')}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label={localize('com_ui_mcp_servers')}>
      {servers.map((server) => (
        <div key={`card_${server.serverName}`} role="listitem">
          <MCPServerCard
            server={server}
            getServerStatusIconProps={getServerStatusIconProps}
            canCreateEditMCPs={canCreateEditMCPs}
          />
        </div>
      ))}
    </div>
  );
}
