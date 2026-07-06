import { History } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { Panel } from '~/common';

interface VersionButtonProps {
  setActivePanel: (panel: Panel) => void;
}

const VersionButton = ({ setActivePanel }: VersionButtonProps) => {
  const localize = useLocalize();

  return (
    <button
      type="button"
      onClick={() => setActivePanel(Panel.version)}
      aria-label={localize('com_ui_agent_version')}
      className="border-border-light text-text-primary hover:bg-surface-secondary focus-visible:ring-ring-primary inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
    >
      <History className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {localize('com_ui_agent_version')}
    </button>
  );
};

export default VersionButton;
