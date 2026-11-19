import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger } from './Tabs';

describe('Tabs', () => {
  it('separates the active tab from the tab-list surface', () => {
    render(
      <Tabs defaultValue="followers">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
      </Tabs>,
    );

    expect(screen.getByRole('tablist', { name: 'Profile sections' })).toHaveClass(
      'bg-surface-secondary',
    );
    expect(screen.getByRole('tab', { name: 'Followers' })).toHaveClass(
      'data-[state=active]:bg-surface-primary',
      'data-[state=active]:text-text-primary',
      'data-[state=active]:shadow-sm',
    );
    expect(screen.getByRole('tab', { name: 'Followers' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Following' })).toHaveAttribute(
      'data-state',
      'inactive',
    );
  });
});
