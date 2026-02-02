import { apiClient } from './client';

export type WizardType = 'ONBOARDING' | 'FOLDER_CREATION' | 'DOCUMENT_GENERATION' | 'CLIENT_CREATION';

export interface WizardProgress {
  id?: string;
  userId?: string;
  wizardType: WizardType;
  currentStep: number;
  totalSteps: number;
  data: Record<string, unknown>;
  completed: boolean;
  completedAt?: string;
  abandonedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  onboardingStep?: number;
  onboardingData?: Record<string, unknown>;
  showWizards: boolean;
}

export interface AllWizardProgress {
  ONBOARDING: WizardProgress;
  FOLDER_CREATION: WizardProgress;
  DOCUMENT_GENERATION: WizardProgress;
  CLIENT_CREATION: WizardProgress;
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await apiClient.get<{ success: boolean; data: OnboardingStatus }>(
    '/wizards/onboarding/status'
  );
  return response.data.data;
}

/**
 * Get all wizard progress
 */
export async function getAllProgress(): Promise<AllWizardProgress> {
  const response = await apiClient.get<{ success: boolean; data: AllWizardProgress }>(
    '/wizards/all'
  );
  return response.data.data;
}

/**
 * Get wizard progress
 */
export async function getProgress(type: WizardType): Promise<WizardProgress> {
  const response = await apiClient.get<{ success: boolean; data: WizardProgress }>(
    `/wizards/${type.toLowerCase()}/progress`
  );
  return response.data.data;
}

/**
 * Update wizard progress
 */
export async function updateProgress(
  type: WizardType,
  data: { currentStep: number; data?: Record<string, unknown> }
): Promise<WizardProgress> {
  const response = await apiClient.put<{ success: boolean; data: WizardProgress }>(
    `/wizards/${type.toLowerCase()}/progress`,
    data
  );
  return response.data.data;
}

/**
 * Complete wizard
 */
export async function completeWizard(type: WizardType): Promise<WizardProgress> {
  const response = await apiClient.post<{ success: boolean; data: WizardProgress }>(
    `/wizards/${type.toLowerCase()}/complete`
  );
  return response.data.data;
}

/**
 * Skip wizard
 */
export async function skipWizard(type: WizardType): Promise<WizardProgress> {
  const response = await apiClient.post<{ success: boolean; data: WizardProgress }>(
    `/wizards/${type.toLowerCase()}/skip`
  );
  return response.data.data;
}

/**
 * Reset wizard
 */
export async function resetWizard(type: WizardType): Promise<WizardProgress> {
  const response = await apiClient.post<{ success: boolean; data: WizardProgress }>(
    `/wizards/${type.toLowerCase()}/reset`
  );
  return response.data.data;
}

/**
 * Update wizard preferences
 */
export async function updatePreferences(preferences: { showWizards?: boolean }): Promise<void> {
  await apiClient.patch('/wizards/preferences', preferences);
}
