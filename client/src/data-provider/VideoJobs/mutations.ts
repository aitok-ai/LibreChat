import { dataService } from 'librechat-data-provider';
import type * as t from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

export const useCreateVideoJobMutation = (
  options?: t.MutationOptions<t.TCreateVideoJobResponse, t.TCreateVideoJobRequest>,
): UseMutationResult<t.TCreateVideoJobResponse, Error, t.TCreateVideoJobRequest> => {
  return useMutation((payload: t.TCreateVideoJobRequest) => dataService.createVideoJob(payload), {
    onMutate: (variables) => options?.onMutate?.(variables),
    onError: (error, variables, context) => options?.onError?.(error, variables, context),
    onSuccess: (data, variables, context) => options?.onSuccess?.(data, variables, context),
    onSettled: (data, error, variables, context) =>
      options?.onSettled?.(data, error, variables, context),
  });
};

export const useCancelVideoJobMutation = (
  options?: t.MutationOptions<{ job_id: string; status: string }, string>,
): UseMutationResult<{ job_id: string; status: string }, Error, string> => {
  return useMutation((jobId: string) => dataService.cancelVideoJob(jobId), {
    onMutate: (variables) => options?.onMutate?.(variables),
    onError: (error, variables, context) => options?.onError?.(error, variables, context),
    onSuccess: (data, variables, context) => options?.onSuccess?.(data, variables, context),
    onSettled: (data, error, variables, context) =>
      options?.onSettled?.(data, error, variables, context),
  });
};
