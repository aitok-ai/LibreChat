import React from 'react';
import { useLocalize } from '~/hooks';

export default function DuplicateConvoButton({ duplicateHandler }) {
  const localize = useLocalize();
  return (
    <button
      type="button"
      onClick={duplicateHandler}
      className="absolute right-6 bottom-[124px] z-10 cursor-pointer rounded-full border border-gray-200 bg-gray-50 text-gray-600 md:bottom-[120px] dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
    >
      {localize('com_ui_duplicate')}
    </button>
  );
}
