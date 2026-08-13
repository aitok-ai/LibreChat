import React from 'react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

type ActionButtonProps = {
  onClick: () => void;
};

export default function ActionButton({ onClick }: ActionButtonProps) {
  const localize = useLocalize();
  return (
    <div className="w-32">
      <Button
        className="border-text-primary bg-surface-primary text-text-primary hover:bg-surface-inverted hover:text-text-inverted w-full rounded-md border p-0"
        onClick={onClick}
      >
        {/* Action Button */}
        {localize('com_ui_action_button')}
      </Button>
    </div>
  );
}
