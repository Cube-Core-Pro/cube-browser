/**
 * CUBE Elite v7 - Hooks Index
 * 
 * Centralized export for all React hooks.
 * These hooks provide state management and backend integration
 * for the application's major modules.
 * 
 * @module hooks
 * @version 1.0.0
 */

// =============================================================================
// Core Module Hooks
// =============================================================================

export { useCRM } from './useCRM';
export type { 
  UseCRMOptions, 
  CRMState, 
  CRMLoadingState, 
  CRMErrorState, 
  CRMFilters,
  UseCRMReturn 
} from './useCRM';

export { useAnalytics } from './useAnalytics';
export type {
  UseAnalyticsOptions,
  AnalyticsState,
  AnalyticsLoadingState,
  AnalyticsErrorState,
  UseAnalyticsReturn
} from './useAnalytics';

export { useMarketing } from './useMarketing';
export type {
  UseMarketingOptions,
  MarketingState,
  MarketingLoadingState,
  MarketingErrorState,
  MarketingFilters,
  UseMarketingReturn
} from './useMarketing';

export { useAutomation } from './useAutomation';
export type {
  UseAutomationOptions,
  AutomationState,
  AutomationLoadingState,
  AutomationErrorState,
  UseAutomationReturn
} from './useAutomation';

export { useSocial } from './useSocial';
export type {
  UseSocialOptions,
  SocialState,
  SocialLoadingState,
  SocialErrorState,
  SocialFilters,
  UseSocialReturn
} from './useSocial';

export { useResearch } from './useResearch';
export type {
  UseResearchOptions,
  ResearchState,
  ResearchLoadingState,
  ResearchErrorState,
  ResearchFilters,
  UseResearchReturn
} from './useResearch';

export { useVideoConference } from './useVideoConference';
export type {
  UseVideoConferenceOptions,
  VideoConferenceState,
  VideoConferenceLoadingState,
  VideoConferenceErrorState,
  UseVideoConferenceReturn
} from './useVideoConference';

// VPN hook - consolidated in vpn-integration-service
export { useVPN } from '@/lib/services/vpn-integration-service';

// =============================================================================
// Default Export
// =============================================================================

const hooks = {
  useCRM: () => import('./useCRM').then(m => m.useCRM),
  useAnalytics: () => import('./useAnalytics').then(m => m.useAnalytics),
  useMarketing: () => import('./useMarketing').then(m => m.useMarketing),
  useAutomation: () => import('./useAutomation').then(m => m.useAutomation),
  useSocial: () => import('./useSocial').then(m => m.useSocial),
  useResearch: () => import('./useResearch').then(m => m.useResearch),
  useVideoConference: () => import('./useVideoConference').then(m => m.useVideoConference),
};

export default hooks;
