import React, { useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { useGetLeaderboardQuery } from 'librechat-data-provider/react-query';
import { GoldMedal, SilverMedal, BronzeMedal, Avatar, EmptyState } from '@librechat/client';
import useDocumentTitle from '~/hooks/useDocumentTitle';
import { useLocalize } from '~/hooks';

const PLACE_ICONS = [
  <GoldMedal key="gold" />,
  <SilverMedal key="silver" />,
  <BronzeMedal key="bronze" />,
];

function sortRows(rows, key, direction) {
  const sorted = [...rows].sort((a, b) => {
    if (key === 'referrals') {
      return direction === 'asc' ? a.referrals - b.referrals : b.referrals - a.referrals;
    }
    return direction === 'asc' ? a.index - b.index : b.index - a.index;
  });
  return sorted;
}

export default function Leaderboard() {
  const localize = useLocalize();
  const query = useGetLeaderboardQuery();
  const [sortKey, setSortKey] = useState('referrals');
  const [sortDir, setSortDir] = useState('desc');

  useDocumentTitle(localize('com_ui_leaderboard'));

  const rows = query.data
    ? query.data.map((u, i) => ({
        index: i,
        name: u.name,
        username: u.username,
        referrals: u.numOfReferrals ?? 0,
      }))
    : [];

  const sorted = rows.length ? sortRows(rows, sortKey, sortDir) : [];

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortArrow = (key) => {
    if (sortKey !== key) return <span className="text-text-tertiary">↕</span>;
    return sortDir === 'desc' ? '↓' : '↑';
  };

  let content;
  if (query.isLoading) {
    content = <div className="bg-surface-tertiary h-48 w-full animate-pulse rounded-xl" />;
  } else if (sorted.length === 0) {
    content = (
      <div className="border-border-light bg-surface-primary overflow-hidden rounded-xl border shadow-sm">
        <EmptyState icon={MessagesSquare} description={localize('com_ui_no_data')} />
      </div>
    );
  } else {
    content = (
      <div className="border-border-light bg-surface-primary w-full overflow-hidden rounded-xl border shadow-sm">
        {/* Header */}
        <div className="border-border-light bg-surface-secondary text-text-secondary grid grid-cols-[3rem_1fr_7rem] border-b text-sm font-semibold">
          <button
            onClick={() => toggleSort('index')}
            className="hover:text-text-primary flex items-center gap-1 px-4 py-3 text-left"
          >
            #<span className="text-xs">{sortArrow('index')}</span>
          </button>
          <button
            onClick={() => toggleSort('index')}
            className="hover:text-text-primary px-4 py-3 text-left"
          >
            {localize('com_ui_user')}
          </button>
          <button
            onClick={() => toggleSort('referrals')}
            className="hover:text-text-primary flex items-center justify-end gap-1 px-4 py-3 text-right"
          >
            {localize('com_ui_referrals')}
            <span className="text-xs">{sortArrow('referrals')}</span>
          </button>
        </div>

        {/* Rows */}
        <div className="divide-border-light divide-y">
          {sorted.map((row) => (
            <div
              key={row.username}
              className="hover:bg-surface-hover grid grid-cols-[3rem_1fr_7rem] items-center px-4 py-3 transition-colors"
            >
              {/* Rank */}
              <div className="flex items-center">
                {row.index < 3 ? (
                  PLACE_ICONS[row.index]
                ) : (
                  <span className="text-text-secondary w-7 text-center text-sm font-medium">
                    {row.index + 1}
                  </span>
                )}
              </div>

              {/* User */}
              <div className="flex items-center gap-3 px-2">
                <Avatar user={{ username: row.username, name: row.name }} size={36} />
                <span className="text-text-primary truncate font-medium">{row.username}</span>
              </div>

              {/* Referrals */}
              <div className="text-right">
                <span className="bg-status-info-subtle text-text-secondary inline-flex h-6 min-w-[3rem] items-center justify-center rounded-full px-2 text-sm font-semibold">
                  {row.referrals}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-canvas flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-8">
        <h1 id="landing-title" className="text-text-primary text-xl font-semibold">
          {localize('com_ui_leaderboard')}
        </h1>
        {content}
      </div>
    </div>
  );
}
