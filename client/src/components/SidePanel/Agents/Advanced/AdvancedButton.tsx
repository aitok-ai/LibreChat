import React from 'react';
import { Settings2 } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { Panel } from '~/common';

interface AdvancedButtonProps {
  setActivePanel: (panel: Panel) => void;
}

const AdvancedButton: React.FC<AdvancedButtonProps> = ({ setActivePanel }) => {
  const localize = useLocalize();

  return (
    <button
      type="button"
      onClick={() => setActivePanel(Panel.advanced)}
      aria-label={localize('com_ui_advanced')}
      className="border-border-light text-text-primary hover:bg-surface-secondary focus-visible:ring-ring-primary inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
    >
      <Settings2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {localize('com_ui_advanced')}
    </button>
  );
};

export default AdvancedButton;
