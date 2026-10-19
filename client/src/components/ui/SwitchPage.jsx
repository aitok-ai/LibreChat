import React from 'react';

export default function SwitchPage({ switchHandler, direction }) {
  return (
    <button
      onClick={switchHandler}
      className={
        direction === 'left'
          ? 'border-border-light bg-surface-primary text-text-secondary absolute top-1/2 left-4 z-10 -translate-y-1/2 cursor-pointer rounded-full border shadow-sm'
          : 'border-border-light bg-surface-primary text-text-secondary absolute top-1/2 right-4 z-10 -translate-y-1/2 cursor-pointer rounded-full border shadow-sm'
      }
    >
      <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="m-1 h-4 w-8"
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        {direction === 'left' ? (
          <>
            <line x1="1" y1="12" x2="19" y2="12" />
            <polyline points="8 19 1 12 8 5" />
          </>
        ) : (
          <>
            <line x1="1" y1="12" x2="19" y2="12" />
            <polyline points="12 19 19 12 12 5" />
          </>
        )}
      </svg>
    </button>
  );
}
