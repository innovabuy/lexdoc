import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as wizardsApi from '@/lib/api/wizards';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { WizardType, WizardProgress } from '@/lib/api/wizards';

/**
 * Get onboarding status
 */
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['wizards', 'onboarding', 'status'],
    queryFn: () => wizardsApi.getOnboardingStatus(),
    staleTime: 60 * 1000,
  });
}

/**
 * Get all wizard progress
 */
export function useAllWizardProgress() {
  return useQuery({
    queryKey: ['wizards', 'all'],
    queryFn: () => wizardsApi.getAllProgress(),
    staleTime: 30 * 1000,
  });
}

/**
 * Get wizard progress
 */
export function useWizardProgress(type: WizardType, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['wizards', type, 'progress'],
    queryFn: () => wizardsApi.getProgress(type),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Update wizard progress
 */
export function useUpdateWizardProgress(type: WizardType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { currentStep: number; data?: Record<string, unknown> }) =>
      wizardsApi.updateProgress(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizards', type] });
      queryClient.invalidateQueries({ queryKey: ['wizards', 'all'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise a jour'));
    },
  });
}

/**
 * Complete wizard
 */
export function useCompleteWizard(type: WizardType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wizardsApi.completeWizard(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizards'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Assistant termine !');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la completion'));
    },
  });
}

/**
 * Skip wizard
 */
export function useSkipWizard(type: WizardType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wizardsApi.skipWizard(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizards'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur'));
    },
  });
}

/**
 * Reset wizard
 */
export function useResetWizard(type: WizardType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wizardsApi.resetWizard(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizards'] });
      toast.success('Assistant reinitialise');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur'));
    },
  });
}

/**
 * Update wizard preferences
 */
export function useUpdateWizardPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: { showWizards?: boolean }) =>
      wizardsApi.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizards'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Preferences mises a jour');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur'));
    },
  });
}

/**
 * Hook for managing wizard state locally
 */
export function useWizard(type: WizardType) {
  const { data: progress, isLoading } = useWizardProgress(type);
  const updateProgress = useUpdateWizardProgress(type);
  const complete = useCompleteWizard(type);
  const skip = useSkipWizard(type);
  const reset = useResetWizard(type);

  const goToStep = (step: number, data?: Record<string, unknown>) => {
    return updateProgress.mutateAsync({ currentStep: step, data });
  };

  const nextStep = (data?: Record<string, unknown>) => {
    if (!progress) return;
    const nextStepNum = Math.min(progress.currentStep + 1, progress.totalSteps - 1);
    return goToStep(nextStepNum, data);
  };

  const prevStep = () => {
    if (!progress) return;
    const prevStepNum = Math.max(progress.currentStep - 1, 0);
    return goToStep(prevStepNum);
  };

  return {
    progress,
    isLoading,
    currentStep: progress?.currentStep ?? 0,
    totalSteps: progress?.totalSteps ?? 1,
    data: progress?.data ?? {},
    isCompleted: progress?.completed ?? false,
    isFirst: (progress?.currentStep ?? 0) === 0,
    isLast: (progress?.currentStep ?? 0) >= (progress?.totalSteps ?? 1) - 1,
    goToStep,
    nextStep,
    prevStep,
    complete: complete.mutateAsync,
    skip: skip.mutateAsync,
    reset: reset.mutateAsync,
    isUpdating: updateProgress.isPending,
    isCompleting: complete.isPending,
    isSkipping: skip.isPending,
  };
}

export type { WizardType, WizardProgress };
