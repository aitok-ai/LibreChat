import { QueryKeys } from 'librechat-data-provider';
import type { QueryClient } from '@tanstack/react-query';
import { activateSelectorCatalogs } from '../ModelSelector';

describe('activateSelectorCatalogs', () => {
  it('refreshes endpoint and startup config when the selector opens', () => {
    const invalidateQueries = jest.fn();
    const queryClient = { invalidateQueries } as Pick<QueryClient, 'invalidateQueries'>;

    activateSelectorCatalogs(true, queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith([QueryKeys.endpoints]);
    expect(invalidateQueries).toHaveBeenCalledWith([QueryKeys.startupConfig]);
    expect(invalidateQueries).toHaveBeenCalledWith([QueryKeys.models]);
  });

  it('does not refresh config when the selector closes', () => {
    const invalidateQueries = jest.fn();
    const queryClient = { invalidateQueries } as Pick<QueryClient, 'invalidateQueries'>;

    activateSelectorCatalogs(false, queryClient);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
