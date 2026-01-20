export type TierType = 'free' | 'pro' | 'elite';

export interface TierFeatures {
  // Automation
  maxWorkflows: number | 'unlimited';
  advancedAutomation: boolean;
  scheduledWorkflows: boolean;
  
  // AI
  aiModel: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  aiRequestsPerDay: number | 'unlimited';
  customAITraining: boolean;
  
  // VPN
  vpnType: 'free-openvpn' | 'custom-config' | 'purevpn-premium';
  vpnLocations: number | 'all';
  
  // Database
  databaseServer: boolean;
  maxDatabases: number | 'unlimited';
  databaseTypes: string[];
  
  // Web Editor
  webEditor: boolean;
  aiDesignAssist: boolean;
  exportOptions: string[];
  
  // Chat & Collaboration
  videoAudioCalls: boolean;
  groupChats: boolean;
  fileSharing: boolean;
  maxTeamMembers: number | 'unlimited';
  
  // Support
  supportLevel: 'community' | 'email' | 'priority';
  responseTime: string;
  dedicatedManager: boolean;
  
  // Enterprise
  whiteLabel: boolean;
  ssoIntegration: boolean;
  slaGuarantee: boolean;
  customIntegrations: boolean;
  apiAccess: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: TierType;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: Date;
  stripePaymentIntentId?: string;
}

export const TIER_FEATURES: Record<TierType, TierFeatures> = {
  free: {
    maxWorkflows: 5,
    advancedAutomation: false,
    scheduledWorkflows: false,
    aiModel: 'gpt-4o-mini',
    aiRequestsPerDay: 50,
    customAITraining: false,
    vpnType: 'free-openvpn',
    vpnLocations: 3,
    databaseServer: false,
    maxDatabases: 0,
    databaseTypes: [],
    webEditor: false,
    aiDesignAssist: false,
    exportOptions: ['json', 'csv'],
    videoAudioCalls: false,
    groupChats: false,
    fileSharing: false,
    maxTeamMembers: 1,
    supportLevel: 'community',
    responseTime: 'best-effort',
    dedicatedManager: false,
    whiteLabel: false,
    ssoIntegration: false,
    slaGuarantee: false,
    customIntegrations: false,
    apiAccess: false,
  },
  pro: {
    maxWorkflows: 'unlimited',
    advancedAutomation: true,
    scheduledWorkflows: true,
    aiModel: 'gpt-4o',
    aiRequestsPerDay: 'unlimited',
    customAITraining: false,
    vpnType: 'custom-config',
    vpnLocations: 50,
    databaseServer: true,
    maxDatabases: 'unlimited',
    databaseTypes: ['postgresql', 'mysql', 'mongodb', 'redis'],
    webEditor: true,
    aiDesignAssist: true,
    exportOptions: ['json', 'csv', 'xml', 'html', 'pdf'],
    videoAudioCalls: true,
    groupChats: true,
    fileSharing: true,
    maxTeamMembers: 5,
    supportLevel: 'email',
    responseTime: '24h',
    dedicatedManager: false,
    whiteLabel: false,
    ssoIntegration: false,
    slaGuarantee: false,
    customIntegrations: false,
    apiAccess: true,
  },
  elite: {
    maxWorkflows: 'unlimited',
    advancedAutomation: true,
    scheduledWorkflows: true,
    aiModel: 'gpt-4-turbo',
    aiRequestsPerDay: 'unlimited',
    customAITraining: true,
    vpnType: 'purevpn-premium',
    vpnLocations: 'all',
    databaseServer: true,
    maxDatabases: 'unlimited',
    databaseTypes: ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'elasticsearch'],
    webEditor: true,
    aiDesignAssist: true,
    exportOptions: ['json', 'csv', 'xml', 'html', 'pdf', 'excel', 'custom'],
    videoAudioCalls: true,
    groupChats: true,
    fileSharing: true,
    maxTeamMembers: 'unlimited',
    supportLevel: 'priority',
    responseTime: '1h',
    dedicatedManager: true,
    whiteLabel: true,
    ssoIntegration: true,
    slaGuarantee: true,
    customIntegrations: true,
    apiAccess: true,
  },
};

export const TIER_PRICES = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 29, annual: 290 },
  elite: { monthly: 99, annual: 990 },
};
