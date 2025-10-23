/**
 * Onboarding state
 */
export type OnboardingState = {
  completed: boolean;
  modelDownloaded: boolean;
  modelSelected: string | null;
};

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.completed && state.modelDownloaded && state.modelSelected !== null;
}
