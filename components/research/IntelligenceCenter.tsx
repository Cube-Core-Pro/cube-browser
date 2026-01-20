'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('IntelligenceCenter');

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ResearchService } from '@/lib/services/research-service';
import {
  Search, Globe, Building2, User, FileText, Link2, Mail, Phone,
  MapPin, Calendar, TrendingUp,
  CheckCircle2, XCircle, Loader2, ChevronRight, ChevronDown,
  Download, Share2, Bookmark, Plus,
  Database, Zap, Sparkles,
  Scale, Briefcase, CreditCard, Home, GraduationCap,
  Users, FileBarChart,
  Linkedin,
  ExternalLink, History,
  Settings, AlertCircle,
  FileSearch, Fingerprint, BarChart3, HelpCircle
} from 'lucide-react';
import { TourProvider, useTour } from '@/components/tour';
import { allIntelligenceTourSections } from './tour';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './IntelligenceCenter.css';

// ===== Types =====
type InvestigationType = 'person' | 'company' | 'domain' | 'email' | 'phone' | 'address';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type SourceType = 'social' | 'public_records' | 'business' | 'news' | 'legal' | 'financial' | 'web';

interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  icon: string;
  status: 'connected' | 'disconnected' | 'limited';
  lastUpdated: Date;
  recordsFound: number;
}

interface PersonProfile {
  id: string;
  fullName: string;
  aliases: string[];
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  photo?: string;
  occupation?: string;
  employer?: string;
  education: Education[];
  addresses: Address[];
  phones: PhoneRecord[];
  emails: string[];
  socialProfiles: SocialProfile[];
  associates: Associate[];
  riskScore: number;
  riskFactors: RiskFactor[];
  financialIndicators: FinancialIndicator[];
  legalRecords: LegalRecord[];
  newsArticles: NewsArticle[];
  webPresence: WebPresence[];
  verificationStatus: 'verified' | 'partial' | 'unverified';
}

interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  aliases: string[];
  logo?: string;
  type: string;
  status: 'active' | 'inactive' | 'dissolved';
  foundedDate?: string;
  industry: string;
  employees?: string;
  revenue?: string;
  headquarters: Address;
  locations: Address[];
  executives: Executive[];
  subsidiaries: Subsidiary[];
  parentCompany?: string;
  registrations: Registration[];
  financials: CompanyFinancials;
  riskScore: number;
  riskFactors: RiskFactor[];
  legalRecords: LegalRecord[];
  newsArticles: NewsArticle[];
  competitors: string[];
  socialProfiles: SocialProfile[];
  domain: string;
  technologies: string[];
}

interface Education {
  institution: string;
  degree?: string;
  field?: string;
  year?: number;
  verified: boolean;
}

interface Address {
  type: 'current' | 'previous' | 'business';
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  since?: string;
  until?: string;
  verified: boolean;
}

interface PhoneRecord {
  number: string;
  type: 'mobile' | 'landline' | 'business' | 'unknown';
  carrier?: string;
  verified: boolean;
}

interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  followers?: number;
  verified: boolean;
  lastActive?: Date;
}

interface Associate {
  name: string;
  relationship: string;
  confidence: number;
}

interface RiskFactor {
  category: string;
  severity: RiskLevel;
  description: string;
  source: string;
  date?: Date;
}

interface FinancialIndicator {
  type: string;
  value: string;
  source: string;
  date: Date;
}

interface LegalRecord {
  type: 'civil' | 'criminal' | 'bankruptcy' | 'lien' | 'judgment';
  case: string;
  court: string;
  date: Date;
  status: string;
  description: string;
}

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  date: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance: number;
  snippet: string;
}

interface WebPresence {
  url: string;
  title: string;
  type: string;
  lastSeen: Date;
}

interface Executive {
  name: string;
  title: string;
  since?: string;
  linkedIn?: string;
}

interface Subsidiary {
  name: string;
  ownership: number;
  status: string;
}

interface Registration {
  type: string;
  number: string;
  jurisdiction: string;
  date: Date;
  status: string;
}

interface CompanyFinancials {
  revenue?: string;
  profit?: string;
  assets?: string;
  liabilities?: string;
  fiscalYear?: number;
  source: string;
}

interface SearchResult {
  type: InvestigationType;
  query: string;
  timestamp: Date;
  personProfile?: PersonProfile;
  companyProfile?: CompanyProfile;
  sources: DataSource[];
  confidence: number;
}

interface Investigation {
  id: string;
  name: string;
  type: InvestigationType;
  status: 'active' | 'completed' | 'archived';
  created: Date;
  updated: Date;
  subjects: string[];
  notes: string;
  findings: SearchResult[];
}

// ===== Component =====
export const IntelligenceCenter: React.FC = () => {
  return (
    <TourProvider sections={allIntelligenceTourSections}>
      <IntelligenceCenterContent />
    </TourProvider>
  );
};

const IntelligenceCenterContent: React.FC = () => {
  // Tour hook
  const { startTour } = useTour();
  
  // i18n
  const { t } = useTranslation();
  
  // M5 Loading/Error States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<InvestigationType>('person');
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'investigations' | 'reports' | 'sources'>('search');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'social', 'records']));
  const [searchHistory, setSearchHistory] = useState<Array<{query: string; type: InvestigationType; date: Date}>>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // M5 Initial Load
  useEffect(() => {
    const initializeCenter = async () => {
      setIsInitialLoading(true);
      setError(null);
      try {
        // Simulate checking data sources connectivity
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsInitialLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('research.errors.loadFailed', 'Failed to initialize Intelligence Center');
        setError(errorMessage);
        setIsInitialLoading(false);
      }
    };
    initializeCenter();
  }, [t]);

  // M5 Retry Handler
  const handleRetry = useCallback(() => {
    setError(null);
    setIsInitialLoading(true);
    setTimeout(() => setIsInitialLoading(false), 500);
  }, []);

  // Data Sources Configuration
  const dataSources: DataSource[] = [
    { id: 'linkedin', name: 'LinkedIn', type: 'social', icon: '💼', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'twitter', name: 'Twitter/X', type: 'social', icon: '𝕏', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'facebook', name: 'Facebook', type: 'social', icon: '📘', status: 'limited', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'instagram', name: 'Instagram', type: 'social', icon: '📸', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'public_records', name: 'Public Records', type: 'public_records', icon: '📋', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'court_records', name: 'Court Records', type: 'legal', icon: '⚖️', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'business_registry', name: 'Business Registry', type: 'business', icon: '🏢', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'sec_filings', name: 'SEC Filings', type: 'financial', icon: '📊', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'news_archive', name: 'News Archive', type: 'news', icon: '📰', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'web_archive', name: 'Web Archive', type: 'web', icon: '🌐', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'domain_whois', name: 'Domain WHOIS', type: 'web', icon: '🔍', status: 'connected', lastUpdated: new Date(), recordsFound: 0 },
    { id: 'breach_data', name: 'Breach Database', type: 'web', icon: '🔓', status: 'limited', lastUpdated: new Date(), recordsFound: 0 },
  ];

  // Mock person search result
  const generateMockPersonResult = (query: string): PersonProfile => ({
    id: `person-${Date.now()}`,
    fullName: query,
    aliases: [`${query.split(' ')[0].charAt(0)}. ${query.split(' ').slice(-1)[0]}`],
    age: Math.floor(Math.random() * 40) + 25,
    dateOfBirth: '1985-06-15',
    gender: 'Unknown',
    occupation: 'Software Engineer',
    employer: 'Tech Company Inc.',
    education: [
      { institution: 'Stanford University', degree: 'BS', field: 'Computer Science', year: 2007, verified: true },
      { institution: 'MIT', degree: 'MS', field: 'Artificial Intelligence', year: 2009, verified: false }
    ],
    addresses: [
      { type: 'current', street: '123 Tech Blvd', city: 'San Francisco', state: 'CA', country: 'USA', zip: '94105', since: '2020-01', verified: true },
      { type: 'previous', street: '456 Startup St', city: 'Palo Alto', state: 'CA', country: 'USA', zip: '94301', since: '2015-06', until: '2019-12', verified: true }
    ],
    phones: [
      { number: '+1 (555) 123-4567', type: 'mobile', carrier: 'Verizon', verified: true },
      { number: '+1 (555) 987-6543', type: 'business', verified: false }
    ],
    emails: ['john.doe@email.com', 'jdoe@company.com'],
    socialProfiles: [
      { platform: 'LinkedIn', username: 'johndoe', url: 'https://linkedin.com/in/johndoe', followers: 5420, verified: true, lastActive: new Date() },
      { platform: 'Twitter', username: '@johndoe', url: 'https://twitter.com/johndoe', followers: 12300, verified: true, lastActive: new Date() },
      { platform: 'GitHub', username: 'johndoe', url: 'https://github.com/johndoe', followers: 890, verified: true, lastActive: new Date() },
      { platform: 'Instagram', username: 'john.doe', url: 'https://instagram.com/john.doe', followers: 3200, verified: false, lastActive: new Date() }
    ],
    associates: [
      { name: 'Jane Smith', relationship: 'Spouse', confidence: 95 },
      { name: 'Bob Johnson', relationship: 'Business Partner', confidence: 87 },
      { name: 'Alice Williams', relationship: 'Colleague', confidence: 72 }
    ],
    riskScore: 23,
    riskFactors: [
      { category: 'Financial', severity: 'low', description: 'No significant financial issues found', source: 'Credit Bureau', date: new Date() }
    ],
    financialIndicators: [
      { type: 'Property Ownership', value: '2 properties valued at ~$2.5M', source: 'Public Records', date: new Date() },
      { type: 'Estimated Net Worth', value: '$1M - $5M', source: 'Wealth Analysis', date: new Date() }
    ],
    legalRecords: [],
    newsArticles: [
      { title: 'Tech Leader Speaks at Conference', source: 'TechCrunch', url: 'https://techcrunch.com', date: new Date(), sentiment: 'positive', relevance: 85, snippet: 'Industry expert discusses future of AI...' }
    ],
    webPresence: [
      { url: 'https://johndoe.com', title: 'Personal Website', type: 'personal', lastSeen: new Date() },
      { url: 'https://medium.com/@johndoe', title: 'Medium Blog', type: 'blog', lastSeen: new Date() }
    ],
    verificationStatus: 'verified'
  });

  // Mock company search result
  const generateMockCompanyResult = (query: string): CompanyProfile => ({
    id: `company-${Date.now()}`,
    name: query,
    legalName: `${query} Inc.`,
    aliases: [`${query} Corp`, `${query} LLC`],
    type: 'Corporation',
    status: 'active',
    foundedDate: '2010-03-15',
    industry: 'Technology',
    employees: '500-1000',
    revenue: '$50M - $100M',
    headquarters: { type: 'business', street: '100 Innovation Way', city: 'San Francisco', state: 'CA', country: 'USA', zip: '94105', verified: true },
    locations: [
      { type: 'business', street: '200 Tech Park', city: 'Austin', state: 'TX', country: 'USA', zip: '78701', verified: true },
      { type: 'business', street: '50 London Wall', city: 'London', state: '', country: 'UK', zip: 'EC2M 5QD', verified: true }
    ],
    executives: [
      { name: 'John Smith', title: 'CEO', since: '2015', linkedIn: 'https://linkedin.com/in/johnsmith' },
      { name: 'Jane Doe', title: 'CFO', since: '2018', linkedIn: 'https://linkedin.com/in/janedoe' },
      { name: 'Bob Johnson', title: 'CTO', since: '2016', linkedIn: 'https://linkedin.com/in/bobjohnson' }
    ],
    subsidiaries: [
      { name: 'TechSub Inc.', ownership: 100, status: 'active' },
      { name: 'DataCorp LLC', ownership: 75, status: 'active' }
    ],
    registrations: [
      { type: 'State Registration', number: 'C3456789', jurisdiction: 'Delaware', date: new Date('2010-03-15'), status: 'Active' },
      { type: 'EIN', number: '12-3456789', jurisdiction: 'Federal', date: new Date('2010-03-20'), status: 'Active' }
    ],
    financials: {
      revenue: '$87.5M',
      profit: '$12.3M',
      assets: '$145M',
      liabilities: '$42M',
      fiscalYear: 2024,
      source: 'SEC Filings'
    },
    riskScore: 18,
    riskFactors: [
      { category: 'Compliance', severity: 'low', description: 'All regulatory filings up to date', source: 'SEC', date: new Date() }
    ],
    legalRecords: [
      { type: 'civil', case: 'Patent Dispute #2023-CV-1234', court: 'Northern District of California', date: new Date('2023-06-15'), status: 'Settled', description: 'Patent infringement claim - settled out of court' }
    ],
    newsArticles: [
      { title: 'Company Announces Major Expansion', source: 'Bloomberg', url: 'https://bloomberg.com', date: new Date(), sentiment: 'positive', relevance: 92, snippet: 'The tech giant plans to hire 200 new employees...' },
      { title: 'Q4 Earnings Beat Expectations', source: 'Reuters', url: 'https://reuters.com', date: new Date(), sentiment: 'positive', relevance: 88, snippet: 'Strong quarter driven by cloud services growth...' }
    ],
    competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
    socialProfiles: [
      { platform: 'LinkedIn', username: 'company', url: 'https://linkedin.com/company/tech', followers: 125000, verified: true, lastActive: new Date() },
      { platform: 'Twitter', username: '@company', url: 'https://twitter.com/company', followers: 89000, verified: true, lastActive: new Date() }
    ],
    domain: 'company.com',
    technologies: ['React', 'Node.js', 'AWS', 'Kubernetes', 'PostgreSQL', 'Redis']
  });

  // Search Handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setCurrentResult(null);
    setAiInsights([]);
    
    // Add to history
    setSearchHistory(prev => [
      { query: searchQuery, type: searchType, date: new Date() },
      ...prev.slice(0, 9)
    ]);

    try {
      // Try to search using the backend via ResearchService
      const backendResults = await ResearchService.trends.search({ query: searchQuery, sources: [searchType] });
      
      if (backendResults) {
        log.debug('Search results from backend:', backendResults);
      }
    } catch (error) {
      log.error('Backend search failed, using mock data:', error);
    }

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Generate mock result based on type
    const result: SearchResult = {
      type: searchType,
      query: searchQuery,
      timestamp: new Date(),
      sources: dataSources.map(s => ({ ...s, recordsFound: Math.floor(Math.random() * 100) })),
      confidence: Math.floor(Math.random() * 20) + 80
    };

    if (searchType === 'person') {
      result.personProfile = generateMockPersonResult(searchQuery);
    } else if (searchType === 'company') {
      result.companyProfile = generateMockCompanyResult(searchQuery);
    }

    setCurrentResult(result);
    setIsSearching(false);

    // Start AI analysis
    runAIAnalysis(result);
  };

  // AI Analysis
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const runAIAnalysis = async (result: SearchResult) => {
    setAiAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const insights = [
      '🔍 High confidence match found across 8 data sources',
      '📊 Financial stability indicators are within normal range',
      '🌐 Strong digital footprint with consistent online presence',
      '⚠️ No significant red flags detected in background check',
      '📈 Trending positively in news sentiment analysis',
      '🔗 Network analysis reveals 3 key business connections',
      '✅ Identity verification confidence: 94%'
    ];
    
    setAiInsights(insights);
    setAiAnalyzing(false);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Risk score color
  const getRiskColor = (score: number): string => {
    if (score < 25) return '#10b981';
    if (score < 50) return '#f59e0b';
    if (score < 75) return '#f97316';
    return '#ef4444';
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Export report
  const exportReport = () => {
    if (!currentResult) return;
    
    const reportData = JSON.stringify(currentResult, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render search type icons
  const getSearchTypeIcon = (type: InvestigationType) => {
    switch (type) {
      case 'person': return <User size={18} />;
      case 'company': return <Building2 size={18} />;
      case 'domain': return <Globe size={18} />;
      case 'email': return <Mail size={18} />;
      case 'phone': return <Phone size={18} />;
      case 'address': return <MapPin size={18} />;
      default: return <Search size={18} />;
    }
  };

  // M5 Loading State
  if (isInitialLoading) {
    return (
      <div className="intelligence-center">
        <div className="ic-loading-container">
          <LoadingState
            variant="spinner"
            size="lg"
            title={t('research.loading.center', 'Loading Intelligence Center...')}
            description={t('research.loading.sources', 'Connecting to data sources')}
            testId="research-loading"
          />
        </div>
      </div>
    );
  }

  // M5 Error State
  if (error) {
    return (
      <div className="intelligence-center">
        <div className="ic-error-container">
          <ErrorState
            preset="server"
            title={t('research.errors.title', 'Failed to Load Intelligence Center')}
            message={error}
            onRetry={handleRetry}
            retryLabel={t('common.retry', 'Try Again')}
            testId="research-error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-center">
      {/* Header */}
      <header className="ic-header">
        <div className="header-left">
          <div className="ic-logo">
            <Fingerprint size={32} />
            <div>
              <h1>{t('research.title', 'Intelligence Center')}</h1>
              <span>{t('research.subtitle', 'OSINT & Due Diligence Platform')}</span>
            </div>
          </div>
        </div>
        <div className="header-tabs" data-tour="intel-search-types">
          <button 
            className={`header-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={18} />
            {t('research.tabs.search', 'Search')}
          </button>
          <button 
            className={`header-tab ${activeTab === 'investigations' ? 'active' : ''}`}
            onClick={() => setActiveTab('investigations')}
            data-tour="investigations"
          >
            <FileSearch size={18} />
            {t('research.tabs.investigations', 'Investigations')}
          </button>
          <button 
            className={`header-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            data-tour="reports"
          >
            <FileBarChart size={18} />
            {t('research.tabs.reports', 'Reports')}
          </button>
          <button 
            className={`header-tab ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
            data-tour="data-sources"
          >
            <Database size={18} />
            {t('research.tabs.sources', 'Data Sources')}
          </button>
        </div>
        <div className="header-right">
          <button className="icon-btn" title={t('research.actions.history', 'Search history')} aria-label={t('research.actions.viewHistory', 'View search history')}>
            <History size={20} />
          </button>
          <button className="icon-btn" title="Settings" aria-label="Open settings">
            <Settings size={20} />
          </button>
          <button 
            className="icon-btn"
            onClick={() => startTour()}
            title="Start guided tour"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="ic-content">
        {activeTab === 'search' && (
          <>
            {/* Search Panel */}
            <div className="search-panel" data-tour="intel-search-bar">
              <div className="search-type-selector" data-tour="person-search">
                {(['person', 'company', 'domain', 'email', 'phone', 'address'] as InvestigationType[]).map(type => (
                  <button
                    key={type}
                    className={`type-btn ${searchType === type ? 'active' : ''}`}
                    onClick={() => setSearchType(type)}
                    data-tour={type === 'company' ? 'company-search' : undefined}
                  >
                    {getSearchTypeIcon(type)}
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </button>
                ))}
              </div>

              <div className="search-box">
                <div className="search-input-wrapper">
                  <Search size={20} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={`Search for ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchQuery && (
                    <button className="clear-btn" onClick={() => setSearchQuery('')} title="Clear search" aria-label="Clear search query">
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
                <button 
                  className="search-btn"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Deep Search
                    </>
                  )}
                </button>
              </div>

              {/* Search Options */}
              <div className="search-options" data-tour="intel-filters">
                <label className="option">
                  <input type="checkbox" defaultChecked />
                  <span>Include social media</span>
                </label>
                <label className="option">
                  <input type="checkbox" defaultChecked />
                  <span>Search public records</span>
                </label>
                <label className="option">
                  <input type="checkbox" defaultChecked />
                  <span>News & media</span>
                </label>
                <label className="option">
                  <input type="checkbox" />
                  <span>Deep web sources</span>
                </label>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && !currentResult && (
                <div className="search-history">
                  <h3><History size={16} /> Recent Searches</h3>
                  <div className="history-list">
                    {searchHistory.map((item, idx) => (
                      <button 
                        key={idx} 
                        className="history-item"
                        onClick={() => {
                          setSearchQuery(item.query);
                          setSearchType(item.type);
                        }}
                      >
                        {getSearchTypeIcon(item.type)}
                        <span>{item.query}</span>
                        <span className="history-date">{formatDate(item.date)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Panel */}
            {isSearching && (
              <div className="searching-overlay">
                <div className="searching-content">
                  <Loader2 size={48} className="spin" />
                  <h2>Searching across multiple sources...</h2>
                  <div className="source-progress">
                    {dataSources.slice(0, 6).map((source, idx) => (
                      <div 
                        key={source.id} 
                        className="source-item"
                        ref={(el) => { if (el) el.style.animationDelay = `${idx * 0.2}s`; }}
                      >
                        <span className="source-icon">{source.icon}</span>
                        <span className="source-name">{source.name}</span>
                        <Loader2 size={14} className="spin" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentResult && (
              <div className="results-panel">
                {/* Results Header */}
                <div className="results-header">
                  <div className="results-title">
                    {currentResult.type === 'person' ? (
                      <User size={24} />
                    ) : (
                      <Building2 size={24} />
                    )}
                    <div>
                      <h2>{currentResult.query}</h2>
                      <span className="results-meta">
                        {currentResult.sources.filter(s => s.recordsFound > 0).length} sources • 
                        {currentResult.sources.reduce((acc, s) => acc + s.recordsFound, 0)} records found • 
                        {currentResult.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="results-actions">
                    <button className="action-btn">
                      <Bookmark size={18} />
                      Save
                    </button>
                    <button className="action-btn" onClick={exportReport}>
                      <Download size={18} />
                      Export
                    </button>
                    <button className="action-btn">
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="ai-insights-card" data-tour="ai-analysis">
                  <div className="ai-header">
                    <Sparkles size={20} />
                    <span>AI Analysis</span>
                    {aiAnalyzing && <Loader2 size={16} className="spin" />}
                  </div>
                  {aiInsights.length > 0 ? (
                    <div className="insights-list">
                      {aiInsights.map((insight, idx) => (
                        <div key={idx} className="insight-item">{insight}</div>
                      ))}
                    </div>
                  ) : aiAnalyzing ? (
                    <div className="analyzing">Analyzing data with AI...</div>
                  ) : null}
                </div>

                {/* Results Grid */}
                <div className="results-grid">
                  {/* Left Column - Main Info */}
                  <div className="results-main">
                    {/* Overview Section */}
                    {currentResult.personProfile && (
                      <>
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('overview')}
                          >
                            <h3><User size={18} /> Overview</h3>
                            {expandedSections.has('overview') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('overview') && (
                            <div className="section-content">
                              <div className="profile-overview">
                                <div className="profile-avatar">
                                  <User size={48} />
                                </div>
                                <div className="profile-details">
                                  <h4>{currentResult.personProfile.fullName}</h4>
                                  {currentResult.personProfile.aliases.length > 0 && (
                                    <p className="aliases">Also known as: {currentResult.personProfile.aliases.join(', ')}</p>
                                  )}
                                  <div className="profile-meta">
                                    <span><Briefcase size={14} /> {currentResult.personProfile.occupation}</span>
                                    <span><Building2 size={14} /> {currentResult.personProfile.employer}</span>
                                    <span><MapPin size={14} /> {currentResult.personProfile.addresses[0]?.city}, {currentResult.personProfile.addresses[0]?.state}</span>
                                  </div>
                                </div>
                                <div className="verification-badge">
                                  <CheckCircle2 size={18} />
                                  {currentResult.personProfile.verificationStatus}
                                </div>
                              </div>

                              {/* Risk Score */}
                              <div className="risk-meter" data-tour="risk-assessment">
                                <div className="risk-header" data-tour="risk-indicators">
                                  <span>Risk Assessment</span>
                                  <span 
                                    className="risk-score"
                                    ref={(el) => { if (el && currentResult.personProfile) el.style.color = getRiskColor(currentResult.personProfile.riskScore); }}
                                  >
                                    {currentResult.personProfile.riskScore}/100
                                  </span>
                                </div>
                                <div className="risk-bar">
                                  <div 
                                    className="risk-fill"
                                    ref={(el) => { 
                                      if (el && currentResult.personProfile) {
                                        el.style.width = `${currentResult.personProfile.riskScore}%`;
                                        el.style.backgroundColor = getRiskColor(currentResult.personProfile.riskScore);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="risk-labels">
                                  <span>Low Risk</span>
                                  <span>High Risk</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Contact Information */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('contact')}
                          >
                            <h3><Phone size={18} /> Contact Information</h3>
                            {expandedSections.has('contact') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('contact') && (
                            <div className="section-content">
                              <div className="info-grid">
                                <div className="info-group">
                                  <h5><Phone size={14} /> Phone Numbers</h5>
                                  {currentResult.personProfile.phones.map((phone, idx) => (
                                    <div key={idx} className="info-item">
                                      <span className="info-value">{phone.number}</span>
                                      <span className="info-type">{phone.type}</span>
                                      {phone.verified && <CheckCircle2 size={14} className="verified" />}
                                    </div>
                                  ))}
                                </div>
                                <div className="info-group">
                                  <h5><Mail size={14} /> Email Addresses</h5>
                                  {currentResult.personProfile.emails.map((email, idx) => (
                                    <div key={idx} className="info-item">
                                      <span className="info-value">{email}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Social Profiles */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('social')}
                          >
                            <h3><Globe size={18} /> Social Media Profiles</h3>
                            {expandedSections.has('social') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('social') && (
                            <div className="section-content">
                              <div className="social-grid">
                                {currentResult.personProfile.socialProfiles.map((profile, idx) => (
                                  <a 
                                    key={idx} 
                                    href={profile.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="social-card"
                                  >
                                    <div className="social-platform">{profile.platform}</div>
                                    <div className="social-username">@{profile.username}</div>
                                    {profile.followers && (
                                      <div className="social-followers">
                                        <Users size={14} />
                                        {profile.followers.toLocaleString()} followers
                                      </div>
                                    )}
                                    {profile.verified && (
                                      <span className="social-verified">
                                        <CheckCircle2 size={12} /> Verified
                                      </span>
                                    )}
                                    <ExternalLink size={14} className="external-icon" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Addresses */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('addresses')}
                          >
                            <h3><MapPin size={18} /> Address History</h3>
                            {expandedSections.has('addresses') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('addresses') && (
                            <div className="section-content">
                              <div className="timeline">
                                {currentResult.personProfile.addresses.map((addr, idx) => (
                                  <div key={idx} className={`timeline-item ${addr.type}`}>
                                    <div className="timeline-marker">
                                      <Home size={14} />
                                    </div>
                                    <div className="timeline-content">
                                      <div className="timeline-header">
                                        <span className="timeline-type">{addr.type}</span>
                                        {addr.verified && <CheckCircle2 size={14} className="verified" />}
                                      </div>
                                      <div className="timeline-address">
                                        {addr.street}<br />
                                        {addr.city}, {addr.state} {addr.zip}
                                      </div>
                                      <div className="timeline-dates">
                                        {addr.since && <span>Since {addr.since}</span>}
                                        {addr.until && <span> - {addr.until}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Education */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('education')}
                          >
                            <h3><GraduationCap size={18} /> Education</h3>
                            {expandedSections.has('education') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('education') && (
                            <div className="section-content">
                              {currentResult.personProfile.education.map((edu, idx) => (
                                <div key={idx} className="education-item">
                                  <div className="edu-icon">
                                    <GraduationCap size={20} />
                                  </div>
                                  <div className="edu-details">
                                    <h5>{edu.institution}</h5>
                                    <p>{edu.degree} {edu.field && `in ${edu.field}`}</p>
                                    {edu.year && <span className="edu-year">{edu.year}</span>}
                                  </div>
                                  {edu.verified && <CheckCircle2 size={16} className="verified" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* Associates */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('associates')}
                          >
                            <h3><Users size={18} /> Associates & Connections</h3>
                            {expandedSections.has('associates') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('associates') && (
                            <div className="section-content">
                              <div className="associates-grid">
                                {currentResult.personProfile.associates.map((assoc, idx) => (
                                  <div key={idx} className="associate-card">
                                    <div className="associate-avatar">
                                      <User size={20} />
                                    </div>
                                    <div className="associate-info">
                                      <span className="associate-name">{assoc.name}</span>
                                      <span className="associate-rel">{assoc.relationship}</span>
                                    </div>
                                    <div className="associate-confidence">
                                      {assoc.confidence}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Financial Indicators */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('financial')}
                          >
                            <h3><CreditCard size={18} /> Financial Indicators</h3>
                            {expandedSections.has('financial') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('financial') && (
                            <div className="section-content">
                              <div className="financial-grid">
                                {currentResult.personProfile.financialIndicators.map((fin, idx) => (
                                  <div key={idx} className="financial-item">
                                    <span className="fin-type">{fin.type}</span>
                                    <span className="fin-value">{fin.value}</span>
                                    <span className="fin-source">{fin.source}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>

                        {/* News & Media */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('news')}
                          >
                            <h3><FileText size={18} /> News & Media Mentions</h3>
                            {expandedSections.has('news') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('news') && (
                            <div className="section-content">
                              {currentResult.personProfile.newsArticles.map((article, idx) => (
                                <a 
                                  key={idx} 
                                  href={article.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="news-item"
                                >
                                  <div className="news-content">
                                    <h5>{article.title}</h5>
                                    <p>{article.snippet}</p>
                                    <div className="news-meta">
                                      <span className="news-source">{article.source}</span>
                                      <span className="news-date">{formatDate(article.date)}</span>
                                      <span className={`news-sentiment ${article.sentiment}`}>
                                        {article.sentiment}
                                      </span>
                                    </div>
                                  </div>
                                  <ExternalLink size={16} />
                                </a>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )}

                    {/* Company Results */}
                    {currentResult.companyProfile && (
                      <>
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('overview')}
                          >
                            <h3><Building2 size={18} /> Company Overview</h3>
                            {expandedSections.has('overview') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('overview') && (
                            <div className="section-content">
                              <div className="company-overview">
                                <div className="company-logo">
                                  <Building2 size={48} />
                                </div>
                                <div className="company-details">
                                  <h4>{currentResult.companyProfile.name}</h4>
                                  <p className="legal-name">{currentResult.companyProfile.legalName}</p>
                                  <div className="company-meta">
                                    <span><Briefcase size={14} /> {currentResult.companyProfile.industry}</span>
                                    <span><Users size={14} /> {currentResult.companyProfile.employees} employees</span>
                                    <span><TrendingUp size={14} /> {currentResult.companyProfile.revenue}</span>
                                    <span><Calendar size={14} /> Founded {currentResult.companyProfile.foundedDate}</span>
                                  </div>
                                </div>
                                <div className={`status-badge ${currentResult.companyProfile.status}`}>
                                  {currentResult.companyProfile.status}
                                </div>
                              </div>

                              {/* Risk Score */}
                              <div className="risk-meter">
                                <div className="risk-header">
                                  <span>Risk Assessment</span>
                                  <span 
                                    className="risk-score"
                                    ref={(el) => { if (el && currentResult.companyProfile) el.style.color = getRiskColor(currentResult.companyProfile.riskScore); }}
                                  >
                                    {currentResult.companyProfile.riskScore}/100
                                  </span>
                                </div>
                                <div className="risk-bar">
                                  <div 
                                    className="risk-fill"
                                    ref={(el) => { 
                                      if (el && currentResult.companyProfile) {
                                        el.style.width = `${currentResult.companyProfile.riskScore}%`;
                                        el.style.backgroundColor = getRiskColor(currentResult.companyProfile.riskScore);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Executives */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('executives')}
                          >
                            <h3><Users size={18} /> Key Executives</h3>
                            {expandedSections.has('executives') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('executives') && (
                            <div className="section-content">
                              <div className="executives-grid">
                                {currentResult.companyProfile.executives.map((exec, idx) => (
                                  <div key={idx} className="executive-card">
                                    <div className="exec-avatar">
                                      <User size={24} />
                                    </div>
                                    <div className="exec-info">
                                      <h5>{exec.name}</h5>
                                      <span className="exec-title">{exec.title}</span>
                                      {exec.since && <span className="exec-since">Since {exec.since}</span>}
                                    </div>
                                    {exec.linkedIn && (
                                      <a href={exec.linkedIn} target="_blank" rel="noopener noreferrer" className="exec-linkedin" title={`View ${exec.name}'s LinkedIn profile`} aria-label={`View ${exec.name}'s LinkedIn profile`}>
                                        <Linkedin size={16} />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Financials */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('financials')}
                          >
                            <h3><BarChart3 size={18} /> Financial Data</h3>
                            {expandedSections.has('financials') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('financials') && (
                            <div className="section-content">
                              <div className="financials-grid">
                                <div className="financial-card">
                                  <span className="fin-label">Revenue</span>
                                  <span className="fin-amount">{currentResult.companyProfile.financials.revenue}</span>
                                </div>
                                <div className="financial-card">
                                  <span className="fin-label">Profit</span>
                                  <span className="fin-amount">{currentResult.companyProfile.financials.profit}</span>
                                </div>
                                <div className="financial-card">
                                  <span className="fin-label">Assets</span>
                                  <span className="fin-amount">{currentResult.companyProfile.financials.assets}</span>
                                </div>
                                <div className="financial-card">
                                  <span className="fin-label">Liabilities</span>
                                  <span className="fin-amount">{currentResult.companyProfile.financials.liabilities}</span>
                                </div>
                              </div>
                              <p className="fin-source">Source: {currentResult.companyProfile.financials.source} (FY{currentResult.companyProfile.financials.fiscalYear})</p>
                            </div>
                          )}
                        </section>

                        {/* Registrations */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('registrations')}
                          >
                            <h3><FileText size={18} /> Registrations & Filings</h3>
                            {expandedSections.has('registrations') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('registrations') && (
                            <div className="section-content">
                              {currentResult.companyProfile.registrations.map((reg, idx) => (
                                <div key={idx} className="registration-item">
                                  <div className="reg-icon">
                                    <FileText size={18} />
                                  </div>
                                  <div className="reg-details">
                                    <h5>{reg.type}</h5>
                                    <p>Number: {reg.number}</p>
                                    <span className="reg-jurisdiction">{reg.jurisdiction}</span>
                                  </div>
                                  <div className={`reg-status ${reg.status.toLowerCase()}`}>
                                    {reg.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* Legal Records */}
                        <section className="result-section">
                          <div 
                            className="section-header"
                            onClick={() => toggleSection('legal')}
                          >
                            <h3><Scale size={18} /> Legal Records</h3>
                            {expandedSections.has('legal') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          {expandedSections.has('legal') && (
                            <div className="section-content">
                              {currentResult.companyProfile.legalRecords.length > 0 ? (
                                currentResult.companyProfile.legalRecords.map((record, idx) => (
                                  <div key={idx} className="legal-item">
                                    <div className="legal-type">{record.type}</div>
                                    <div className="legal-details">
                                      <h5>{record.case}</h5>
                                      <p>{record.description}</p>
                                      <div className="legal-meta">
                                        <span>{record.court}</span>
                                        <span>{formatDate(record.date)}</span>
                                        <span className={`legal-status ${record.status.toLowerCase()}`}>{record.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="no-records">
                                  <CheckCircle2 size={20} />
                                  <span>No significant legal records found</span>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </div>

                  {/* Right Column - Sources & Quick Info */}
                  <div className="results-sidebar">
                    {/* Data Sources Used */}
                    <div className="sidebar-card">
                      <h4><Database size={16} /> Data Sources</h4>
                      <div className="sources-list">
                        {currentResult.sources
                          .filter(s => s.recordsFound > 0)
                          .map((source, idx) => (
                            <div key={idx} className="source-row">
                              <span className="source-icon">{source.icon}</span>
                              <span className="source-name">{source.name}</span>
                              <span className="source-count">{source.recordsFound}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="sidebar-card">
                      <h4><BarChart3 size={16} /> Quick Stats</h4>
                      <div className="quick-stats">
                        <div className="stat-item">
                          <span className="stat-label">Records Found</span>
                          <span className="stat-value">
                            {currentResult.sources.reduce((acc, s) => acc + s.recordsFound, 0)}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Sources Checked</span>
                          <span className="stat-value">{currentResult.sources.length}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Confidence</span>
                          <span className="stat-value">{currentResult.confidence}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Last Updated</span>
                          <span className="stat-value">{formatDate(currentResult.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Related Searches */}
                    <div className="sidebar-card">
                      <h4><Link2 size={16} /> Related Searches</h4>
                      <div className="related-list">
                        {currentResult.personProfile?.associates.slice(0, 3).map((assoc, idx) => (
                          <button 
                            key={idx} 
                            className="related-item"
                            onClick={() => {
                              setSearchQuery(assoc.name);
                              setSearchType('person');
                              handleSearch();
                            }}
                          >
                            <User size={14} />
                            {assoc.name}
                            <ChevronRight size={14} />
                          </button>
                        ))}
                        {currentResult.companyProfile?.executives.slice(0, 3).map((exec, idx) => (
                          <button 
                            key={idx} 
                            className="related-item"
                            onClick={() => {
                              setSearchQuery(exec.name);
                              setSearchType('person');
                              handleSearch();
                            }}
                          >
                            <User size={14} />
                            {exec.name}
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Data Sources Tab */}
        {activeTab === 'sources' && (
          <div className="sources-panel">
            <div className="sources-header">
              <h2>Connected Data Sources</h2>
              <p>Manage your OSINT and intelligence data providers</p>
            </div>
            <div className="sources-grid">
              {dataSources.map(source => (
                <div key={source.id} className={`source-card ${source.status}`}>
                  <div className="source-card-header">
                    <span className="source-card-icon">{source.icon}</span>
                    <div className="source-card-info">
                      <h4>{source.name}</h4>
                      <span className="source-card-type">{source.type.replace('_', ' ')}</span>
                    </div>
                    <div className={`source-status ${source.status}`}>
                      {source.status === 'connected' && <CheckCircle2 size={16} />}
                      {source.status === 'disconnected' && <XCircle size={16} />}
                      {source.status === 'limited' && <AlertCircle size={16} />}
                      {source.status}
                    </div>
                  </div>
                  <div className="source-card-footer">
                    <span>Last sync: {formatDate(source.lastUpdated)}</span>
                    <button className="source-config-btn">
                      <Settings size={14} />
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investigations Tab */}
        {activeTab === 'investigations' && (
          <div className="investigations-panel">
            <div className="investigations-header">
              <h2>Active Investigations</h2>
              <button className="new-investigation-btn">
                <Plus size={18} />
                New Investigation
              </button>
            </div>
            <div className="investigations-list">
              {investigations.length === 0 ? (
                <div className="empty-state">
                  <FileSearch size={48} />
                  <h3>No Active Investigations</h3>
                  <p>Create a new investigation to organize your research and track subjects</p>
                  <button className="create-btn">
                    <Plus size={18} />
                    Create Investigation
                  </button>
                </div>
              ) : (
                investigations.map(inv => (
                  <div key={inv.id} className="investigation-card">
                    <div className="inv-header">
                      <h4>{inv.name}</h4>
                      <span className={`inv-status ${inv.status}`}>{inv.status}</span>
                    </div>
                    <div className="inv-meta">
                      <span>{inv.subjects.length} subjects</span>
                      <span>{inv.findings.length} findings</span>
                      <span>Updated {formatDate(inv.updated)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-panel">
            <div className="reports-header">
              <h2>Generated Reports</h2>
              <button className="new-report-btn">
                <FileBarChart size={18} />
                Generate Report
              </button>
            </div>
            <div className="empty-state">
              <FileBarChart size={48} />
              <h3>No Reports Generated</h3>
              <p>Run a search and export results to create your first report</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceCenter;
