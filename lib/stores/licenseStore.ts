// ============================================================================
// CUBE Nexum Elite - License Store (Zustand)
// ============================================================================
// Global state management for license information
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { licenseService, LicenseInfo, FeatureName, FEATURES } from '@/lib/services/licenseService';

// ============================================================================
// Types
// ============================================================================

interface LicenseState {
  // License info
  license: LicenseInfo | null;
  isLoading: boolean;
  error: string | null;
  lastValidation: number;
  
  // Device info
  deviceId: string | null;
  
  // Computed values
  tier: 'free' | 'pro' | 'elite';
  isActive: boolean;
  isOfflineMode: boolean;
  daysRemaining: number | null;
  
  // Actions
  validateLicense: (force?: boolean) => Promise<void>;
  activateLicense: (licenseKey: string, userEmail: string) => Promise<void>;
  deactivateLicense: () => Promise<void>;
  checkFeature: (feature: FeatureName) => boolean;
  refreshLicense: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      // Initial state
      license: null,
      isLoading: false,
      error: null,
      lastValidation: 0,
      deviceId: null,
      tier: 'free',
      isActive: false,
      isOfflineMode: false,
      daysRemaining: null,
      
      // =======================================================================
      // Actions
      // =======================================================================

      validateLicense: async (force = false) => {
        const state = get();
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        // Skip if recently validated and not forced
        if (!force && state.lastValidation && (now - state.lastValidation < CACHE_DURATION)) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const info = await licenseService.validateLicense(force);
          const deviceId = await licenseService.getDeviceId();
          
          set({
            license: info,
            deviceId,
            tier: info.tier,
            isActive: info.has_license && (info.status === 'valid' || info.status === 'offline_grace_period'),
            isOfflineMode: info.is_offline_mode,
            daysRemaining: info.days_remaining,
            lastValidation: now,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'License validation failed',
            isLoading: false,
            tier: 'free',
            isActive: false,
          });
        }
      },

      activateLicense: async (licenseKey: string, userEmail: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const info = await licenseService.activateLicense(licenseKey, userEmail);
          const deviceId = await licenseService.getDeviceId();
          
          set({
            license: info,
            deviceId,
            tier: info.tier,
            isActive: info.has_license && info.status === 'valid',
            isOfflineMode: info.is_offline_mode,
            daysRemaining: info.days_remaining,
            lastValidation: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'License activation failed',
            isLoading: false,
          });
          throw error;
        }
      },

      deactivateLicense: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await licenseService.deactivateLicense();
          
          set({
            license: null,
            tier: 'free',
            isActive: false,
            isOfflineMode: false,
            daysRemaining: null,
            lastValidation: 0,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'License deactivation failed',
            isLoading: false,
          });
          throw error;
        }
      },

      checkFeature: (feature: FeatureName): boolean => {
        const { tier, isActive } = get();
        
        // Free features always allowed
        if ((FEATURES.FREE as readonly string[]).includes(feature)) {
          return true;
        }
        
        // Must have active license for paid features
        if (!isActive) {
          return false;
        }
        
        // Pro features require Pro or Elite
        if ((FEATURES.PRO as readonly string[]).includes(feature)) {
          return tier === 'pro' || tier === 'elite';
        }
        
        // Elite features require Elite
        if ((FEATURES.ELITE as readonly string[]).includes(feature)) {
          return tier === 'elite';
        }
        
        return false;
      },

      refreshLicense: async () => {
        await get().validateLicense(true);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cube-nexum-license',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        license: state.license,
        deviceId: state.deviceId,
        lastValidation: state.lastValidation,
        tier: state.tier,
        isActive: state.isActive,
      }),
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check if a feature is available
 */
export function useFeatureCheck(feature: FeatureName): {
  allowed: boolean;
  tier: 'free' | 'pro' | 'elite';
  isLoading: boolean;
} {
  const { checkFeature, tier, isLoading } = useLicenseStore();
  
  return {
    allowed: checkFeature(feature),
    tier,
    isLoading,
  };
}

/**
 * Hook to get license status
 */
export function useLicenseStatus() {
  const {
    license,
    tier,
    isActive,
    isOfflineMode,
    daysRemaining,
    isLoading,
    error,
    deviceId,
  } = useLicenseStore();
  
  return {
    license,
    tier,
    isActive,
    isOfflineMode,
    daysRemaining,
    isLoading,
    error,
    deviceId,
  };
}

/**
 * Hook to require a specific tier
 * Returns null if tier is met, or upgrade message if not
 */
export function useRequireTier(requiredTier: 'pro' | 'elite'): string | null {
  const { tier, isActive } = useLicenseStore();
  
  if (!isActive) {
    return 'Please activate your license to access this feature.';
  }
  
  const tierOrder = { free: 0, pro: 1, elite: 2 };
  
  if (tierOrder[tier] < tierOrder[requiredTier]) {
    return `This feature requires ${requiredTier.toUpperCase()} tier. Current tier: ${tier.toUpperCase()}`;
  }
  
  return null;
}

// ============================================================================
// Selectors
// ============================================================================

export const selectLicenseTier = (state: LicenseState) => state.tier;
export const selectIsActive = (state: LicenseState) => state.isActive;
export const selectLicenseInfo = (state: LicenseState) => state.license;
export const selectDeviceId = (state: LicenseState) => state.deviceId;
