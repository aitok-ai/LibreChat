import type { TokenUsageView } from '~/hooks/Chat/useTokenUsage';
import type { CurrencyConfig } from '~/utils';
import { groupToolTokens, formatTokens, formatCost } from '~/utils';
import { useLocalize } from '~/hooks';

interface RowProps {
  label: string;
  value: number;
  max?: number;
}

function Row({ label, value, max }: RowProps) {
  const percent = max != null && max > 0 ? Math.min((value / max) * 100, 100) : null;
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">
        {formatTokens(value)}
        {percent != null && (
          <span className="text-text-secondary ml-1 text-xs" aria-hidden="true">
            ({Math.round(percent)}%)
          </span>
        )}
      </span>
    </div>
  );
}

interface BreakdownProps {
  view: TokenUsageView;
  showCost: boolean;
  currency?: CurrencyConfig;
}

export default function Breakdown({ view, showCost, currency }: BreakdownProps) {
  const localize = useLocalize();
  const { usedTokens, maxTokens, percent, snapshot, snapshotActive, branchUsage, hasUsage } = view;
  /** Show the all-branches total only when it (a) exceeds the active branch —
   *  epsilon guards against float summation order surfacing a spurious row in an
   *  unbranched conversation — and (b) has COMPLETE cost coverage, so a sibling
   *  branch saved without cost can't render an under-reported total. */
  const showTotal = view.totalUsage.costKnown && view.totalCost - view.branchCost > 1e-9;

  const breakdown = snapshotActive ? snapshot?.breakdown : undefined;
  const instructionTokens =
    snapshot?.effectiveInstructionTokens ?? breakdown?.instructionTokens ?? 0;
  const systemTokens =
    (breakdown?.systemMessageTokens ?? 0) + (breakdown?.dynamicInstructionTokens ?? 0);
  /** Summary has its own row, so exclude it (it's part of `usedTokens`) to avoid
   *  double-counting it inside the Messages row on a summarized turn. */
  const messageTokens = Math.max(
    0,
    usedTokens - instructionTokens - (breakdown?.summaryTokens ?? 0),
  );
  const freeTokens = maxTokens != null ? Math.max(0, maxTokens - usedTokens) : null;

  const groups =
    breakdown?.toolTokenCounts != null
      ? groupToolTokens(breakdown.toolTokenCounts, breakdown.deferredToolNames)
      : null;
  const toolRows =
    groups == null
      ? null
      : ([
          [localize('com_ui_context_tools_system'), groups.system],
          [localize('com_ui_context_tools_mcp'), groups.mcp],
          [localize('com_ui_skills'), groups.skills],
          [localize('com_ui_context_subagents'), groups.subagents],
          [localize('com_ui_context_tools_system_deferred'), groups.systemDeferred],
          [localize('com_ui_context_tools_mcp_deferred'), groups.mcpDeferred],
        ] as const);

  return (
    <div className="w-64 space-y-3" role="region" aria-label={localize('com_ui_context_usage')}>
      <div className="flex items-center justify-between">
        <span className="text-text-primary text-sm font-medium">
          {localize('com_ui_context_window')}
        </span>
        <span className="text-text-secondary text-xs font-medium">
          {maxTokens != null
            ? `${formatTokens(usedTokens)} / ${formatTokens(maxTokens)} (${Math.round(percent)}%)`
            : formatTokens(usedTokens)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={maxTokens != null ? Math.round(percent) : undefined}
        aria-label={localize('com_ui_context_usage')}
        className="bg-surface-tertiary h-2 w-full overflow-hidden rounded-full"
      >
        {percent > 0 && (
          <div
            className="bg-text-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        )}
      </div>

      <div
        className="space-y-1.5"
        data-testid={breakdown ? 'context-breakdown' : 'context-estimate'}
      >
        {breakdown ? (
          <>
            <Row
              label={localize('com_ui_context_messages')}
              value={messageTokens}
              max={maxTokens}
            />
            {systemTokens > 0 && (
              <Row label={localize('com_ui_context_system')} value={systemTokens} max={maxTokens} />
            )}
            {toolRows != null ? (
              toolRows.map(
                ([label, value]) =>
                  value > 0 && <Row key={label} label={label} value={value} max={maxTokens} />,
              )
            ) : (
              <Row
                label={localize('com_ui_context_tools')}
                value={breakdown.toolSchemaTokens}
                max={maxTokens}
              />
            )}
            {breakdown.summaryTokens > 0 && (
              <Row
                label={localize('com_ui_context_summary')}
                value={breakdown.summaryTokens}
                max={maxTokens}
              />
            )}
            {freeTokens != null && (
              <Row label={localize('com_ui_context_free')} value={freeTokens} max={maxTokens} />
            )}
          </>
        ) : (
          <>
            {view.branchTotals.summaryBaseline > 0 && (
              <Row
                label={localize('com_ui_context_summary')}
                value={view.branchTotals.summaryBaseline}
                max={maxTokens}
              />
            )}
            <Row label={localize('com_ui_input')} value={view.branchTotals.input} />
            <Row
              label={localize('com_ui_output')}
              value={view.branchTotals.output + view.liveTokens}
            />
            {maxTokens == null && (
              <p className="text-text-secondary text-xs">{localize('com_ui_context_unknown')}</p>
            )}
            <p className="text-text-secondary text-xs italic">{localize('com_ui_estimated')}</p>
          </>
        )}
      </div>

      {hasUsage && (
        <>
          <div className="border-border-light border-t" role="separator" />
          <div className="space-y-1.5" data-testid="token-usage-totals">
            <Row label={localize('com_ui_input')} value={branchUsage.input} />
            <Row label={localize('com_ui_output')} value={branchUsage.output} />
            {branchUsage.cacheRead > 0 && (
              <Row label={localize('com_ui_cache_read')} value={branchUsage.cacheRead} />
            )}
            {branchUsage.cacheWrite > 0 && (
              <Row label={localize('com_ui_cache_write')} value={branchUsage.cacheWrite} />
            )}
          </div>
        </>
      )}

      {showCost && hasUsage && branchUsage.costKnown && (
        <>
          <div className="border-border-light border-t" role="separator" />
          <div className="space-y-1.5" data-testid="token-usage-cost">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {showTotal
                  ? localize('com_ui_context_cost_branch')
                  : localize('com_ui_context_cost')}
              </span>
              <span className="text-text-primary font-medium">
                {formatCost(view.branchCost, currency)}
              </span>
            </div>
            {showTotal && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{localize('com_ui_context_cost_total')}</span>
                <span className="text-text-secondary">{formatCost(view.totalCost, currency)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
