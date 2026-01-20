/**
 * CUBE Nexum - Site Configuration Types
 * 
 * Centralized configuration types for all company/site settings
 * managed by SuperAdmin panel.
 * 
 * @module site-configuration
 */

// =============================================================================
// CONTACT INFORMATION
// =============================================================================

export interface ContactInfo {
  phones: {
    support: string;
    sales: string;
    main?: string;
    emergency?: string;
  };
  emails: {
    info: string;
    support: string;
    careers: string;
    investors: string;
    press?: string;
    legal?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  businessHours?: {
    timezone: string;
    schedule: {
      day: string;
      open: string;
      close: string;
      closed?: boolean;
    }[];
  };
}

// =============================================================================
// SOCIAL MEDIA
// =============================================================================

export interface SocialMediaLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  discord?: string;
  github?: string;
  medium?: string;
}

// =============================================================================
// LEGAL INFORMATION
// =============================================================================

export interface LegalInfo {
  companyName: string;
  tradeName?: string;
  registrationCountry: string;
  taxId: string;
  registrationNumber?: string;
  vatNumber?: string;
  incorporationDate?: string;
  legalAddress?: string;
  regulatoryLicenses?: {
    name: string;
    number: string;
    authority: string;
    validUntil?: string;
  }[];
}

// =============================================================================
// BRANDING
// =============================================================================

export interface BrandingConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    error: string;
    success: string;
    warning: string;
  };
  logo: {
    main: string;
    favicon: string;
    darkMode?: string;
    icon?: string;
  };
  typography?: {
    primaryFont: string;
    secondaryFont: string;
    monoFont: string;
  };
  tagline: string;
  slogan?: string;
  mission?: string;
  vision?: string;
}

// =============================================================================
// INVESTOR INFORMATION
// =============================================================================

export interface InvestorConfig {
  expectedReturn: {
    min: number;
    max: number;
    average: number;
    period: 'monthly' | 'quarterly' | 'yearly';
  };
  minimumInvestment: {
    amount: number;
    currency: string;
  };
  investmentTypes: {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount?: number;
    expectedReturn: number;
    lockPeriod?: number; // days
    riskLevel: 'low' | 'medium' | 'high';
    features: string[];
    active: boolean;
  }[];
  tokens?: {
    id: string;
    symbol: string;
    name: string;
    description: string;
    price: number;
    totalSupply: number;
    availableSupply: number;
    blockchain?: string;
    contractAddress?: string;
  }[];
  documents?: {
    name: string;
    type: 'prospectus' | 'terms' | 'whitepaper' | 'audit' | 'other';
    url: string;
    version?: string;
  }[];
  disclaimers: string[];
}

// =============================================================================
// CAREERS CONFIGURATION
// =============================================================================

export interface CareersConfig {
  openPositions: {
    id: string;
    title: string;
    department: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
    experience: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    salary?: {
      min: number;
      max: number;
      currency: string;
      period: 'hourly' | 'monthly' | 'yearly';
    };
    benefits?: string[];
    techStack?: string[];
    postedDate: string;
    closingDate?: string;
    active: boolean;
    featured?: boolean;
  }[];
  benefits: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category: 'health' | 'financial' | 'lifestyle' | 'professional' | 'other';
  }[];
  techStack: {
    category: string;
    technologies: string[];
  }[];
  culture?: {
    values: string[];
    perks: string[];
    workEnvironment?: string;
  };
  applicationProcess?: {
    steps: {
      order: number;
      name: string;
      description: string;
    }[];
  };
}

// =============================================================================
// COMPLETE SITE CONFIGURATION
// =============================================================================

export interface SiteConfiguration {
  id: string;
  version: string;
  lastUpdated: string;
  updatedBy: string;
  
  contact: ContactInfo;
  social: SocialMediaLinks;
  legal: LegalInfo;
  branding: BrandingConfig;
  investors: InvestorConfig;
  careers: CareersConfig;
  
  // Feature flags
  features?: {
    investorPortalEnabled: boolean;
    careersPageEnabled: boolean;
    chatSupportEnabled: boolean;
    phoneSupport24x7: boolean;
    whatsappEnabled: boolean;
    aiAssistantEnabled: boolean;
  };
  
  // SEO & Meta
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  
  // Custom fields for extensibility
  customFields?: Record<string, unknown>;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_SITE_CONFIGURATION: SiteConfiguration = {
  id: 'default',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system',
  
  contact: {
    phones: {
      support: '+1 (555) 123-4567',
      sales: '+1 (555) 123-4568',
      main: '+1 (555) 123-4500',
    },
    emails: {
      info: 'info@cube-nexum.com',
      support: 'support@cube-nexum.com',
      careers: 'careers@cube-nexum.com',
      investors: 'investors@cube-nexum.com',
    },
    address: {
      street: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
    },
  },
  
  social: {
    linkedin: 'https://linkedin.com/company/cube-nexum',
    twitter: 'https://twitter.com/cube_nexum',
    instagram: 'https://instagram.com/cube_nexum',
    youtube: 'https://youtube.com/@cube-nexum',
    github: 'https://github.com/cube-nexum',
  },
  
  legal: {
    companyName: 'CUBE Nexum Technologies Inc.',
    registrationCountry: 'USA',
    taxId: 'XX-XXXXXXX',
    registrationNumber: 'DE-XXXXXXXX',
  },
  
  branding: {
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f172a',
      text: '#f8fafc',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
    },
    logo: {
      main: '/images/logo.svg',
      favicon: '/favicon.ico',
    },
    tagline: 'The Future of Business Automation',
  },
  
  investors: {
    expectedReturn: {
      min: 8,
      max: 25,
      average: 15,
      period: 'yearly',
    },
    minimumInvestment: {
      amount: 1000,
      currency: 'USD',
    },
    investmentTypes: [
      {
        id: 'seed',
        name: 'Seed Investment',
        description: 'Early-stage investment with highest potential returns',
        minAmount: 10000,
        maxAmount: 100000,
        expectedReturn: 25,
        lockPeriod: 365,
        riskLevel: 'high',
        features: ['Equity participation', 'Board observer rights', 'Quarterly reports'],
        active: true,
      },
      {
        id: 'growth',
        name: 'Growth Fund',
        description: 'Balanced investment for steady growth',
        minAmount: 1000,
        maxAmount: 50000,
        expectedReturn: 15,
        lockPeriod: 180,
        riskLevel: 'medium',
        features: ['Revenue share', 'Monthly reports', 'Early access to features'],
        active: true,
      },
    ],
    disclaimers: [
      'Past performance does not guarantee future results.',
      'All investments carry risk of loss.',
    ],
  },
  
  careers: {
    openPositions: [],
    benefits: [
      {
        id: 'health',
        name: 'Health Insurance',
        description: 'Comprehensive health, dental, and vision coverage',
        category: 'health',
      },
      {
        id: 'equity',
        name: 'Equity Package',
        description: 'Stock options for all full-time employees',
        category: 'financial',
      },
      {
        id: 'remote',
        name: 'Remote Work',
        description: 'Work from anywhere policy',
        category: 'lifestyle',
      },
      {
        id: 'learning',
        name: 'Learning Budget',
        description: '$2,000 annual learning & development budget',
        category: 'professional',
      },
    ],
    techStack: [
      { category: 'Frontend', technologies: ['React', 'TypeScript', 'Tailwind CSS'] },
      { category: 'Backend', technologies: ['Rust', 'Node.js', 'PostgreSQL'] },
      { category: 'AI/ML', technologies: ['OpenAI', 'LangChain', 'Python'] },
      { category: 'Infrastructure', technologies: ['AWS', 'Docker', 'Kubernetes'] },
    ],
  },
  
  features: {
    investorPortalEnabled: true,
    careersPageEnabled: true,
    chatSupportEnabled: true,
    phoneSupport24x7: false,
    whatsappEnabled: true,
    aiAssistantEnabled: true,
  },
};
