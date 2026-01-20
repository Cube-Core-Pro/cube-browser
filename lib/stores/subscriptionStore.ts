import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { TierType, Subscription, TIER_FEATURES, TierFeatures } from '@/types/subscription';

interface SubscriptionStore {
  // State
  currentTier: TierType;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  
  // Computed
  features: TierFeatures;
  isFreeTier: boolean;
  isProTier: boolean;
  isEliteTier: boolean;
  canAccessFeature: (feature: keyof TierFeatures) => boolean;
  
  // Actions
  setTier: (tier: TierType) => void;
  setSubscription: (subscription: Subscription | null) => void;
  loadSubscription: () => Promise<void>;
  upgradeTier: (tier: TierType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: keyof TierFeatures, value?: unknown) => boolean;
  getFeatureLimit: (feature: keyof TierFeatures) => number | 'unlimited';
  isTrialing: () => boolean;
  daysUntilRenewal: () => number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentTier: 'free',
      subscription: null,
      loading: false,
      error: null,
      
      // Computed Properties
      get features() {
        return TIER_FEATURES[get().currentTier];
      },
      
      get isFreeTier() {
        return get().currentTier === 'free';
      },
      
      get isProTier() {
        return get().currentTier === 'pro';
      },
      
      get isEliteTier() {
        return get().currentTier === 'elite';
      },
      
      get canAccessFeature() {
        return (feature: keyof TierFeatures) => {
          const features = get().features;
          const value = features[feature];
          
          // Boolean features
          if (typeof value === 'boolean') {
            return value;
          }
          
          // Numeric features (check if > 0)
          if (typeof value === 'number') {
            return value > 0;
          }
          
          // Unlimited features
          if (value === 'unlimited') {
            return true;
          }
          
          // Array features (check if not empty)
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          
          // String features (check if not empty)
          if (typeof value === 'string') {
            return value.length > 0;
          }
          
          return false;
        };
      },
      
      // Actions
      setTier: (tier: TierType) => {
        set({ currentTier: tier, error: null });
      },
      
      setSubscription: (subscription: Subscription | null) => {
        set({
          subscription,
          currentTier: subscription?.tier || 'free',
          error: null,
        });
      },
      
      loadSubscription: async () => {
        set({ loading: true, error: null });
        try {
          const subscription = await invoke<Subscription>('get_current_subscription');
          set({ 
            subscription, 
            currentTier: subscription?.tier || 'free', 
            loading: false 
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load subscription',
          });
        }
      },
      
      upgradeTier: async (tier: TierType) => {
        set({ loading: true, error: null });
        try {
          const checkoutUrl = await invoke<string>('create_checkout_session', { tier });
          // Redirect to Stripe checkout
          if (typeof window !== 'undefined') {
            window.location.href = checkoutUrl;
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to upgrade tier',
          });
        }
      },
      
      cancelSubscription: async () => {
        const { subscription } = get();
        if (!subscription) return;
        
        set({ loading: true, error: null });
        try {
          await invoke('cancel_subscription', { subscriptionId: subscription.id });
          
          set({
            subscription: {
              ...subscription,
              cancelAtPeriodEnd: true,
            },
            loading: false,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription',
          });
        }
      },
      
      resumeSubscription: async () => {
        const { subscription } = get();
        if (!subscription) return;
        
        set({ loading: true, error: null });
        try {
          await invoke('resume_subscription', { subscriptionId: subscription.id });
          
          set({
            subscription: {
              ...subscription,
              cancelAtPeriodEnd: false,
            },
            loading: false,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to resume subscription',
          });
        }
      },
      
      checkFeatureAccess: (feature: keyof TierFeatures, value?: unknown) => {
        const features = get().features;
        const featureValue = features[feature];
        
        // Si no se proporciona un valor, solo verificar si la función existe
        if (value === undefined) {
          return get().canAccessFeature(feature);
        }
        
        // Verificar límites numéricos
        if (typeof featureValue === 'number') {
          return typeof value === 'number' && value <= featureValue;
        }
        
        // Verificar unlimited
        if (featureValue === 'unlimited') {
          return true;
        }
        
        // Verificar arrays (si el valor está en el array)
        if (Array.isArray(featureValue)) {
          return featureValue.includes(value as string);
        }
        
        // Verificar igualdad directa
        return featureValue === value;
      },
      
      getFeatureLimit: (feature: keyof TierFeatures) => {
        const featureValue = get().features[feature];
        
        if (typeof featureValue === 'number' || featureValue === 'unlimited') {
          return featureValue;
        }
        
        if (Array.isArray(featureValue)) {
          return featureValue.length;
        }
        
        return 0;
      },
      
      isTrialing: () => {
        const { subscription } = get();
        if (!subscription) return false;
        
        return (
          subscription.status === 'trialing' &&
          subscription.trialEndsAt !== undefined &&
          new Date(subscription.trialEndsAt) > new Date()
        );
      },
      
      daysUntilRenewal: () => {
        const { subscription } = get();
        if (!subscription) return 0;
        
        const now = new Date();
        const end = new Date(subscription.currentPeriodEnd);
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        return days > 0 ? days : 0;
      },
      
      setLoading: (loading: boolean) => {
        set({ loading });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      reset: () => {
        set({
          currentTier: 'free',
          subscription: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        currentTier: state.currentTier,
        subscription: state.subscription,
      }),
    }
  )
);

// Hook para verificar acceso a funciones específicas
export const useFeatureAccess = (feature: keyof TierFeatures, value?: unknown) => {
  const checkAccess = useSubscriptionStore((state) => state.checkFeatureAccess);
  return checkAccess(feature, value);
};

// Hook para obtener el límite de una función
export const useFeatureLimit = (feature: keyof TierFeatures) => {
  const getLimit = useSubscriptionStore((state) => state.getFeatureLimit);
  return getLimit(feature);
};

// Hook para verificar el tier actual
export const useTier = () => {
  const tier = useSubscriptionStore((state) => state.currentTier);
  const isFreeTier = useSubscriptionStore((state) => state.isFreeTier);
  const isProTier = useSubscriptionStore((state) => state.isProTier);
  const isEliteTier = useSubscriptionStore((state) => state.isEliteTier);
  
  return { tier, isFreeTier, isProTier, isEliteTier };
};
