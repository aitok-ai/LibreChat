import { dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type * as t from 'librechat-data-provider';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export const useGetVideoJobQuery = (
  jobId?: string,
  config?: UseQueryOptions<t.TVideoJobStatusResponse>,
): QueryObserverResult<t.TVideoJobStatusResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TVideoJobStatusResponse>(
    ['videoJob', jobId],
    () => dataService.getVideoJob(jobId as string),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: Boolean(jobId) && (config?.enabled ?? true) === true && queriesEnabled,
      ...config,
    },
  );
};
