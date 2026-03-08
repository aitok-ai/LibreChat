export default function ActiveSetting() {
  const activeModelLabel = '[latest] Tailwind CSS GPT';
  const talkingToLabel = 'Talking to';

  return (
    <div className="text-token-text-tertiary space-x-2 overflow-hidden text-sm font-light text-ellipsis">
      {talkingToLabel}{' '}
      <span className="text-token-text-secondary font-medium">{activeModelLabel}</span>
    </div>
  );
}
