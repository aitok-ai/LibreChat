import React from 'react';
import { useDragHelpers } from '~/hooks';
import DragDropOverlay from '~/components/Chat/Input/Files/DragDropOverlay';
import DragDropModal from '~/components/Chat/Input/Files/DragDropModal';
import { DragDropProvider } from '~/Providers';
import { cn } from '~/utils';

interface DragDropWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function DragDropWrapper({ children, className }: DragDropWrapperProps) {
  const { isOver, canDrop, drop, showModal, setShowModal, draggedFiles, handleOptionSelect } =
    useDragHelpers();

  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!isOver) {
      setIsDismissed(false);
    }
  }, [isOver]);

  // Force overlay to be inactive for testing purposes
  const isActive = false; // canDrop && isOver && !isDismissed;

  return (
    <div ref={drop} className={cn('relative flex h-full w-full', className)}>
      {children}
      {/** Always render overlay to avoid mount/unmount overhead */}
      <DragDropOverlay isActive={isActive} onDismiss={() => setIsDismissed(true)} />
      <DragDropProvider>
        <DragDropModal
          files={draggedFiles}
          isVisible={showModal}
          setShowModal={setShowModal}
          onOptionSelect={handleOptionSelect}
        />
      </DragDropProvider>
    </div>
  );
}
