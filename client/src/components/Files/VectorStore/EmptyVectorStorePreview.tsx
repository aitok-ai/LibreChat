import React from 'react';

export default function EmptyVectorStorePreview() {
  const emptyStateLabel = 'Select a vector store to view details.';

  return (
    <div className="h-full w-full content-center text-center font-bold">{emptyStateLabel}</div>
  );
}
