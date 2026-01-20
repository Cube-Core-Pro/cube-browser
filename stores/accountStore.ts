// ============================================================================
// CUBE Nexum Elite - Account Store (Zustand)
// ============================================================================
// Global state management for user account information including:
// - Profile details (name, email, phone)
// - Avatar/profile picture
// - Billing address
// - Communication preferences
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface BillingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  vatNumber?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  avatarType: 'url' | 'base64' | 'initials' | 'gravatar';
  timezone: string;
  locale: string;
  dateFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPreferences {
  emailNotifications: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  pushNotifications: boolean;
}

export interface AccountState {
  // Profile
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Billing
  billingAddress: BillingAddress | null;
  billingHistory: BillingHistoryItem[];
  
  // Communication
  communicationPreferences: CommunicationPreferences;
  
  // Actions - Profile
  setProfile: (profile: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setAvatar: (avatar: string, type: 'url' | 'base64') => void;
  removeAvatar: () => void;
  
  // Actions - Billing
  setBillingAddress: (address: BillingAddress) => void;
  updateBillingAddress: (updates: Partial<BillingAddress>) => Promise<void>;
  clearBillingAddress: () => void;
  
  // Actions - Communication
  updateCommunicationPreferences: (prefs: Partial<CommunicationPreferences>) => void;
  
  // Actions - General
  loadAccount: () => Promise<void>;
  saveAccount: () => Promise<void>;
  resetAccount: () => void;
  exportAccountData: () => string;
  
  // Helpers
  getInitials: () => string;
  getDisplayName: () => string;
  getAvatarUrl: () => string | null;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoiceUrl?: string;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultProfile: UserProfile = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  displayName: '',
  phone: '',
  avatar: undefined,
  avatarType: 'initials',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: 'en-US',
  dateFormat: 'MM/DD/YYYY',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultBillingAddress: BillingAddress = {
  firstName: '',
  lastName: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  vatNumber: '',
};

const defaultCommunicationPreferences: CommunicationPreferences = {
  emailNotifications: true,
  productUpdates: true,
  marketingEmails: false,
  securityAlerts: true,
  weeklyDigest: false,
  pushNotifications: true,
};

// ============================================================================
// Store
// ============================================================================

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      isLoading: false,
      error: null,
      billingAddress: null,
      billingHistory: [],
      communicationPreferences: defaultCommunicationPreferences,

      // =======================================================================
      // Profile Actions
      // =======================================================================

      setProfile: (profile) => {
        set((state) => ({
          profile: state.profile 
            ? { ...state.profile, ...profile, updatedAt: new Date().toISOString() }
            : { ...defaultProfile, ...profile, updatedAt: new Date().toISOString() },
          error: null,
        }));
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        
        try {
          // In production, this would call the backend API
          // await invoke('update_user_profile', { updates });
          
          set((state) => ({
            profile: state.profile 
              ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
              : { ...defaultProfile, ...updates, updatedAt: new Date().toISOString() },
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update profile',
          });
          throw error;
        }
      },

      setAvatar: (avatar, type) => {
        set((state) => ({
          profile: state.profile 
            ? { ...state.profile, avatar, avatarType: type, updatedAt: new Date().toISOString() }
            : { ...defaultProfile, avatar, avatarType: type, updatedAt: new Date().toISOString() },
        }));
      },

      removeAvatar: () => {
        set((state) => ({
          profile: state.profile 
            ? { ...state.profile, avatar: undefined, avatarType: 'initials', updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      // =======================================================================
      // Billing Actions
      // =======================================================================

      setBillingAddress: (address) => {
        set({ billingAddress: address, error: null });
      },

      updateBillingAddress: async (updates) => {
        set({ isLoading: true, error: null });
        
        try {
          // In production, this would call the backend API
          // await invoke('update_billing_address', { updates });
          
          set((state) => ({
            billingAddress: state.billingAddress 
              ? { ...state.billingAddress, ...updates }
              : { ...defaultBillingAddress, ...updates },
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update billing address',
          });
          throw error;
        }
      },

      clearBillingAddress: () => {
        set({ billingAddress: null });
      },

      // =======================================================================
      // Communication Actions
      // =======================================================================

      updateCommunicationPreferences: (prefs) => {
        set((state) => ({
          communicationPreferences: {
            ...state.communicationPreferences,
            ...prefs,
          },
        }));
      },

      // =======================================================================
      // General Actions
      // =======================================================================

      loadAccount: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In production, this would call the backend API
          // const accountData = await invoke('get_account_data');
          // set({ profile: accountData.profile, billingAddress: accountData.billingAddress, ... });
          
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load account',
          });
        }
      },

      saveAccount: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In production, this would call the backend API
          // const accountData = get();
          // await invoke('save_account_data', { 
          //   profile: accountData.profile, 
          //   billingAddress: accountData.billingAddress,
          //   communicationPreferences: accountData.communicationPreferences
          // });
          
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to save account',
          });
        }
      },

      resetAccount: () => {
        set({
          profile: null,
          billingAddress: null,
          billingHistory: [],
          communicationPreferences: defaultCommunicationPreferences,
          error: null,
        });
      },

      exportAccountData: () => {
        const state = get();
        return JSON.stringify({
          profile: state.profile,
          billingAddress: state.billingAddress,
          communicationPreferences: state.communicationPreferences,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      // =======================================================================
      // Helpers
      // =======================================================================

      getInitials: () => {
        const { profile } = get();
        if (!profile) return 'U';
        
        const first = profile.firstName?.charAt(0) || '';
        const last = profile.lastName?.charAt(0) || '';
        
        if (first && last) return `${first}${last}`.toUpperCase();
        if (profile.displayName) {
          const parts = profile.displayName.split(' ');
          if (parts.length >= 2) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
          }
          return profile.displayName.charAt(0).toUpperCase();
        }
        if (profile.email) return profile.email.charAt(0).toUpperCase();
        return 'U';
      },

      getDisplayName: () => {
        const { profile } = get();
        if (!profile) return 'User';
        
        if (profile.displayName) return profile.displayName;
        if (profile.firstName && profile.lastName) {
          return `${profile.firstName} ${profile.lastName}`;
        }
        if (profile.firstName) return profile.firstName;
        if (profile.email) return profile.email.split('@')[0];
        return 'User';
      },

      getAvatarUrl: () => {
        const { profile } = get();
        if (!profile?.avatar) return null;
        
        if (profile.avatarType === 'url') {
          return profile.avatar;
        }
        
        if (profile.avatarType === 'base64') {
          return profile.avatar;
        }
        
        if (profile.avatarType === 'gravatar' && profile.email) {
          // In production, use proper gravatar hash
          return `https://www.gravatar.com/avatar/?d=identicon`;
        }
        
        return null;
      },
    }),
    {
      name: 'account-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        billingAddress: state.billingAddress,
        communicationPreferences: state.communicationPreferences,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectProfile = (state: AccountState) => state.profile;
export const selectBillingAddress = (state: AccountState) => state.billingAddress;
export const selectCommunicationPreferences = (state: AccountState) => state.communicationPreferences;
export const selectIsLoading = (state: AccountState) => state.isLoading;
export const selectError = (state: AccountState) => state.error;

// ============================================================================
// Country Options for Billing
// ============================================================================

export const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'CN', name: 'China' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (DE)' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (JP)' },
] as const;
