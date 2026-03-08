import AddedConvo from './AddedConvo';
import type { TConversation } from 'librechat-data-provider';
import type { SetterOrUpdater } from 'recoil';

export default function TextareaHeader({
  addedConvo,
  setAddedConvo,
}: {
  addedConvo: TConversation | null;
  setAddedConvo: SetterOrUpdater<TConversation | null>;
}) {
  if (!addedConvo) {
    return null;
  }
  return (
    <div className="bg-surface-secondary-alt m-1.5 flex flex-col divide-y overflow-hidden rounded-t-2xl rounded-b-lg">
      <AddedConvo addedConvo={addedConvo} setAddedConvo={setAddedConvo} />
    </div>
  );
}
