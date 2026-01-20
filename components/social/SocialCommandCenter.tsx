'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SocialService, SocialAccount as BackendSocialAccount, SocialPost as BackendSocialPost, TrendingContent as BackendTrendingContent } from '@/lib/services/social-service';
import { 
  Instagram, Twitter, Facebook, Linkedin, Youtube, 
  Video, Image as ImageIcon, FileText, Calendar, Clock, 
  TrendingUp, Users, Heart, MessageCircle,
  Sparkles, Wand2, Music, Mic, 
  Scissors, Play, SkipForward, Volume2,
  Upload, Eye, BarChart3, Target,
  Zap, Bot, Globe, Hash, AtSign,
  Camera, Film, Layers, Type, PenTool,
  RefreshCw, Copy, Bookmark, Bell, Settings,
  Plus, X, ChevronRight, Check,
  AlertCircle, Star, Crown, Flame, Rocket,
  Grid3X3, List, LayoutGrid, Maximize2,
  Activity, Award, DollarSign, HelpCircle
} from 'lucide-react';
import { TourProvider, useTour } from '@/components/tour';
import { allSocialTourSections } from './tour';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import { logger } from '@/lib/services/logger-service';
import './SocialCommandCenter.css';

const log = logger.scope('SocialCommandCenter');

// M5 State Types
interface DataLoadingState {
  accounts: boolean;
  posts: boolean;
  trends: boolean;
  stats: boolean;
}

interface DataErrorState {
  accounts: string | null;
  posts: string | null;
  trends: string | null;
  stats: string | null;
}

// Types
interface SocialAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok' | 'threads' | 'pinterest' | 'snapchat';
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  engagement: number;
  isConnected: boolean;
  lastSync: Date;
}

interface ContentPost {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'short' | 'thread';
  content: string;
  media: MediaAsset[];
  platforms: string[];
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  analytics?: PostAnalytics;
  hashtags: string[];
  mentions: string[];
}

interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  size: number;
}

interface PostAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagement: number;
}

interface VideoProject {
  id: string;
  name: string;
  type: 'short' | 'reel' | 'tiktok' | 'story' | 'long';
  duration: number;
  clips: VideoClip[];
  audio?: AudioTrack;
  captions: Caption[];
  effects: VideoEffect[];
  status: 'editing' | 'rendering' | 'ready';
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
}

interface VideoClip {
  id: string;
  source: MediaAsset;
  startTime: number;
  endTime: number;
  position: number;
  effects: VideoEffect[];
  transitions: string[];
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  volume: number;
  isTrending?: boolean;
}

interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: CaptionStyle;
}

interface CaptionStyle {
  font: string;
  size: number;
  color: string;
  background?: string;
  animation: 'none' | 'fade' | 'typewriter' | 'bounce' | 'highlight';
  position: 'top' | 'center' | 'bottom';
}

interface VideoEffect {
  type: string;
  intensity: number;
  startTime?: number;
  endTime?: number;
}

interface TrendingContent {
  id: string;
  platform: string;
  type: 'hashtag' | 'audio' | 'challenge' | 'template';
  name: string;
  uses: number;
  growth: number;
  category: string;
}

interface AIContentSuggestion {
  id: string;
  type: 'caption' | 'hashtags' | 'hook' | 'cta' | 'script';
  content: string;
  platform: string;
  confidence: number;
  viralScore: number;
}

interface ScheduleSlot {
  platform: string;
  bestTime: Date;
  audienceActive: number;
  competition: 'low' | 'medium' | 'high';
}

// Platform configurations
const PLATFORMS = {
  instagram: { name: 'Instagram', icon: Instagram, color: '#E4405F', formats: ['post', 'reel', 'story', 'carousel'] },
  twitter: { name: 'X (Twitter)', icon: Twitter, color: '#1DA1F2', formats: ['tweet', 'thread', 'space'] },
  facebook: { name: 'Facebook', icon: Facebook, color: '#1877F2', formats: ['post', 'reel', 'story', 'live'] },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', formats: ['post', 'article', 'newsletter'] },
  youtube: { name: 'YouTube', icon: Youtube, color: '#FF0000', formats: ['video', 'short', 'live', 'community'] },
  tiktok: { name: 'TikTok', icon: Video, color: '#000000', formats: ['video', 'live', 'story'] },
  threads: { name: 'Threads', icon: AtSign, color: '#000000', formats: ['post', 'thread'] },
  pinterest: { name: 'Pinterest', icon: Grid3X3, color: '#E60023', formats: ['pin', 'idea', 'video'] },
  snapchat: { name: 'Snapchat', icon: Camera, color: '#FFFC00', formats: ['snap', 'story', 'spotlight'] }
};

// Trending audio library
const TRENDING_AUDIO = [
  { id: '1', name: 'Viral Beat #1', artist: 'Trending', uses: 2500000, category: 'trending' },
  { id: '2', name: 'Chill Lo-Fi', artist: 'LoFi Beats', uses: 1800000, category: 'lofi' },
  { id: '3', name: 'Upbeat Energy', artist: 'Viral Sounds', uses: 3200000, category: 'energetic' },
  { id: '4', name: 'Emotional Piano', artist: 'Cinematic', uses: 950000, category: 'emotional' },
  { id: '5', name: 'Comedy Timing', artist: 'Sound FX', uses: 4100000, category: 'comedy' },
];

// Caption styles presets
const CAPTION_STYLES: CaptionStyle[] = [
  { font: 'Impact', size: 32, color: '#FFFFFF', background: '#000000', animation: 'bounce', position: 'center' },
  { font: 'Montserrat', size: 28, color: '#FFFFFF', animation: 'highlight', position: 'bottom' },
  { font: 'Roboto', size: 24, color: '#FFD700', animation: 'typewriter', position: 'center' },
  { font: 'Comic Sans MS', size: 30, color: '#FF69B4', animation: 'bounce', position: 'top' },
];

export const SocialCommandCenter: React.FC = () => {
  return (
    <TourProvider tourId="social" sections={allSocialTourSections}>
      <SocialCommandCenterContent />
    </TourProvider>
  );
};

const SocialCommandCenterContent: React.FC = () => {
  // Tour hook
  const { startTour } = useTour();
  
  // i18n hook
  const { t } = useTranslation();
  
  // M5 Loading States
  const [loadingState, setLoadingState] = useState<DataLoadingState>({
    accounts: true,
    posts: true,
    trends: true,
    stats: true
  });
  
  // M5 Error States
  const [errorState, setErrorState] = useState<DataErrorState>({
    accounts: null,
    posts: null,
    trends: null,
    stats: null
  });
  
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'schedule' | 'analytics' | 'ai-studio' | 'trends'>('dashboard');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [videoProject, setVideoProject] = useState<VideoProject | null>(null);
  const [trends, setTrends] = useState<TrendingContent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentSuggestion[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [scheduleSlots, _setScheduleSlots] = useState<ScheduleSlot[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // M5 Retry function wrapper
  const retryWithState = useCallback(async <T,>(
    key: keyof DataLoadingState,
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoadingState(prev => ({ ...prev, [key]: true }));
    setErrorState(prev => ({ ...prev, [key]: null }));
    try {
      const result = await asyncFn();
      setLoadingState(prev => ({ ...prev, [key]: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('social.errors.unknownError', 'An unknown error occurred');
      setErrorState(prev => ({ ...prev, [key]: errorMessage }));
      setLoadingState(prev => ({ ...prev, [key]: false }));
      return null;
    }
  }, [t]);

  // Initialize with data from backend
  useEffect(() => {
    loadAccountsFromBackend();
    loadPostsFromBackend();
    loadTrendsFromBackend();
    loadStatsFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccountsFromBackend = useCallback(async () => {
    await retryWithState('accounts', async () => {
      const backendAccounts = await SocialService.accounts.getAll();
      if (backendAccounts && backendAccounts.length > 0) {
        setAccounts(backendAccounts.map((acc: BackendSocialAccount) => ({
          id: acc.id,
          platform: acc.platform.toLowerCase() as SocialAccount['platform'],
          username: acc.username,
          displayName: acc.display_name,
          avatar: acc.profile_url,
          followers: acc.followers,
          engagement: 0,
          isConnected: acc.is_connected,
          lastSync: acc.last_sync ? new Date(acc.last_sync) : new Date()
        })));
      } else {
        // No accounts found - this is not an error, just empty state
        setAccounts([]);
      }
      return true;
    });
  }, [retryWithState]);

  const loadPostsFromBackend = useCallback(async () => {
    await retryWithState('posts', async () => {
      const backendPosts = await SocialService.posts.getAll();
      if (backendPosts && backendPosts.length > 0) {
        setPosts(backendPosts.map((post: BackendSocialPost) => ({
          id: post.id,
          type: 'image' as ContentPost['type'],
          content: post.content,
          media: post.media_urls.map((url, idx) => ({ id: `media-${idx}`, type: 'image' as const, url, size: 0 })),
          platforms: post.platforms.map(p => p.toLowerCase()),
          scheduledTime: post.scheduled_at ? new Date(post.scheduled_at) : undefined,
          status: post.status.toLowerCase() as ContentPost['status'],
          hashtags: post.tags,
          mentions: []
        })));
      } else {
        setPosts([]);
      }
      return true;
    });
  }, [retryWithState]);

  const loadTrendsFromBackend = useCallback(async () => {
    await retryWithState('trends', async () => {
      const backendTrends = await SocialService.analytics.getTrending();
      if (backendTrends && backendTrends.length > 0) {
        setTrends(backendTrends.map((t: BackendTrendingContent) => ({
          id: t.id,
          platform: t.platforms[0]?.toLowerCase() || 'tiktok',
          type: 'hashtag' as TrendingContent['type'],
          name: t.topic,
          uses: t.volume,
          growth: t.growth,
          category: 'trending'
        })));
      } else {
        setTrends([]);
      }
      return true;
    });
  }, [retryWithState]);

  const loadStatsFromBackend = useCallback(async () => {
    await retryWithState('stats', async () => {
      const stats = await SocialService.analytics.getStats();
      log.debug('Social stats loaded:', stats);
      return stats;
    });
  }, [retryWithState]);

  // M5 Retry handlers
  const handleRetryAccounts = useCallback(() => {
    loadAccountsFromBackend();
  }, [loadAccountsFromBackend]);

  const handleRetryPosts = useCallback(() => {
    loadPostsFromBackend();
  }, [loadPostsFromBackend]);

  const handleRetryTrends = useCallback(() => {
    loadTrendsFromBackend();
  }, [loadTrendsFromBackend]);

  // Check if all data is loading (initial load)
  const isInitialLoading = loadingState.accounts && loadingState.posts && loadingState.trends;
  
  // Check if there's any critical error
  const hasCriticalError = errorState.accounts !== null && errorState.posts !== null;

  // AI Content Generation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateAIContent = async (prompt: string, _type: string) => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const suggestions: AIContentSuggestion[] = [
      {
        id: '1',
        type: 'caption',
        content: `🔥 ${prompt}\n\nTransform your workflow with AI-powered automation.\n\n💡 Save 10+ hours weekly\n🚀 Boost productivity by 300%\n✨ No coding required\n\nTap the link in bio to start free! 👆`,
        platform: 'instagram',
        confidence: 0.94,
        viralScore: 87
      },
      {
        id: '2',
        type: 'hook',
        content: 'POV: You just discovered the tool that\'s about to change your entire workflow...',
        platform: 'tiktok',
        confidence: 0.91,
        viralScore: 92
      },
      {
        id: '3',
        type: 'hashtags',
        content: '#automation #productivity #techtools #worksmarter #AItools #efficiency #startup #entrepreneur #business #viral',
        platform: 'instagram',
        confidence: 0.88,
        viralScore: 78
      },
      {
        id: '4',
        type: 'script',
        content: `HOOK: "What if I told you there's a tool that does in 5 minutes what takes most people 5 hours?"\n\nPROBLEM: "We all know managing social media across 10 platforms is exhausting..."\n\nSOLUTION: "Introducing CUBE Elite - your AI-powered command center"\n\nBENEFITS: "Create once, publish everywhere. AI writes your captions. Schedule for peak times."\n\nCTA: "Link in bio to try it free"`,
        platform: 'all',
        confidence: 0.96,
        viralScore: 95
      }
    ];
    
    setAiSuggestions(suggestions);
    setIsGenerating(false);
  };

  // Video Creation Functions
  const createShortVideo = async () => {
    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      name: 'New Short Video',
      type: 'short',
      duration: 0,
      clips: [],
      captions: [],
      effects: [],
      status: 'editing',
      aspectRatio: '9:16'
    };
    setVideoProject(newProject);
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMedia: MediaAsset[] = [];
    
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
      
      newMedia.push({
        id: crypto.randomUUID(),
        type,
        url,
        size: file.size,
        thumbnail: type === 'video' ? await generateThumbnail(url) : url
      });
    }
    
    setMediaFiles(prev => [...prev, ...newMedia]);
  };

  const generateThumbnail = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        resolve(canvas.toDataURL());
      };
    });
  };

  // Auto-generate captions with AI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateCaptions = async (_videoId: string) => {
    setIsGenerating(true);
    
    // Simulate AI caption generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockCaptions: Caption[] = [
      { id: '1', text: 'Hey everyone!', startTime: 0, endTime: 2, style: CAPTION_STYLES[0] },
      { id: '2', text: 'Let me show you something amazing', startTime: 2, endTime: 5, style: CAPTION_STYLES[0] },
      { id: '3', text: 'This is going to blow your mind', startTime: 5, endTime: 8, style: CAPTION_STYLES[1] },
    ];
    
    if (videoProject) {
      setVideoProject({ ...videoProject, captions: mockCaptions });
    }
    
    setIsGenerating(false);
  };

  // Multi-platform publishing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publishToAll = async (post: ContentPost) => {
    try {
      // First create the post in the backend
      const createdPost = await invoke('social_create_post', {
        content: post.content,
        platforms: post.platforms,
        postType: post.type,
        hashtags: post.hashtags,
        mentions: post.mentions,
        mediaUrls: post.media.map(m => m.url)
      });
      
      // Then publish it
      for (const platform of post.platforms) {
        try {
          await invoke('social_publish_post', { 
            postId: typeof createdPost === 'object' && createdPost !== null ? (createdPost as ContentPost).id : post.id,
            platform 
          });
          log.debug(`Successfully published to ${platform}`);
        } catch (platformError) {
          log.error(`Failed to publish to ${platform}:`, platformError);
        }
      }
      
      // Reload posts after publishing
      await loadPostsFromBackend();
    } catch (error) {
      log.error('Failed to publish post:', error);
      // Fallback to console logging
      for (const platform of post.platforms) {
        log.debug(`Publishing to ${platform}:`, post.content);
      }
    }
  };

  // Format numbers with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="scc-dashboard">
      {/* Quick Stats */}
      <div className="scc-stats-grid">
        <div className="scc-stat-card gradient-purple">
          <div className="stat-icon"><Users /></div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(accounts.reduce((sum, a) => sum + a.followers, 0))}</span>
            <span className="stat-label">Total Followers</span>
          </div>
          <div className="stat-trend positive">+12.5%</div>
        </div>
        
        <div className="scc-stat-card gradient-blue">
          <div className="stat-icon"><Activity /></div>
          <div className="stat-content">
            <span className="stat-value">{(accounts.reduce((sum, a) => sum + a.engagement, 0) / accounts.length).toFixed(1)}%</span>
            <span className="stat-label">Avg Engagement</span>
          </div>
          <div className="stat-trend positive">+2.3%</div>
        </div>
        
        <div className="scc-stat-card gradient-green">
          <div className="stat-icon"><Eye /></div>
          <div className="stat-content">
            <span className="stat-value">2.4M</span>
            <span className="stat-label">Monthly Reach</span>
          </div>
          <div className="stat-trend positive">+18.7%</div>
        </div>
        
        <div className="scc-stat-card gradient-orange">
          <div className="stat-icon"><Calendar /></div>
          <div className="stat-content">
            <span className="stat-value">{posts.filter(p => p.status === 'scheduled').length}</span>
            <span className="stat-label">Scheduled Posts</span>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="scc-section" data-tour="accounts-list">
        <div className="section-header">
          <h3><Globe /> Connected Platforms</h3>
          <button className="btn-add" onClick={() => setShowAccountModal(true)} data-tour="connect-account-btn" title="Connect a new social account">
            <Plus /> Add Account
          </button>
        </div>
        
        <div className="accounts-grid">
          {accounts.map(account => {
            const platform = PLATFORMS[account.platform];
            const Icon = platform.icon;
            
            return (
              <div key={account.id} className="account-card" ref={(el) => { if (el) el.style.borderColor = platform.color; }}>
                <div className="account-header">
                  <div className="account-avatar" ref={(el) => { if (el) el.style.backgroundColor = platform.color; }}>
                    <Icon size={20} />
                  </div>
                  <div className="account-info">
                    <span className="account-name">{account.displayName}</span>
                    <span className="account-username">{account.username}</span>
                  </div>
                  <div className={`account-status ${account.isConnected ? 'connected' : 'disconnected'}`}>
                    {account.isConnected ? <Check size={14} /> : <AlertCircle size={14} />}
                  </div>
                </div>
                
                <div className="account-stats">
                  <div className="stat">
                    <Users size={14} />
                    <span>{formatNumber(account.followers)}</span>
                  </div>
                  <div className="stat">
                    <Heart size={14} />
                    <span>{account.engagement}%</span>
                  </div>
                </div>
                
                <div className="account-actions">
                  <button className="btn-action" data-tour="sync-btn" title="Sync account"><RefreshCw size={14} /> Sync</button>
                  <button className="btn-action" title="Account settings" aria-label="Account settings"><Settings size={14} /></button>
                </div>
              </div>
            );
          })}
          
          {/* Add More Platforms */}
          {Object.entries(PLATFORMS).filter(([key]) => !accounts.find(a => a.platform === key)).slice(0, 4).map(([key, platform]) => {
            const Icon = platform.icon;
            return (
              <div key={key} className="account-card add-account" onClick={() => setShowAccountModal(true)}>
                <div className="account-avatar" ref={(el) => { if (el) { el.style.backgroundColor = platform.color; el.style.opacity = '0.5'; } }}>
                  <Icon size={20} />
                </div>
                <span className="add-label">Connect {platform.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="scc-section">
        <div className="section-header">
          <h3><Calendar /> Upcoming Posts</h3>
          <button className="btn-view-all" title="Open content calendar">View Calendar</button>
        </div>
        
        <div className="posts-timeline">
          {posts.filter(p => p.status === 'scheduled').map(post => (
            <div key={post.id} className="post-item">
              <div className="post-time">
                <Clock size={14} />
                {post.scheduledTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="post-content">
                <p>{post.content.substring(0, 80)}...</p>
                <div className="post-platforms">
                  {post.platforms.map(p => {
                    const platform = PLATFORMS[p as keyof typeof PLATFORMS];
                    const Icon = platform?.icon;
                    return Icon ? <Icon key={p} size={16} ref={(el: SVGSVGElement | null) => { if (el) el.style.color = platform.color; }} /> : null;
                  })}
                </div>
              </div>
              <div className="post-actions">
                <button title="Edit post" aria-label="Edit post"><PenTool size={14} /></button>
                <button title="Delete post" aria-label="Delete post"><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Times to Post */}
      <div className="scc-section" data-tour="best-times">
        <div className="section-header">
          <h3><Zap /> Best Times to Post Today</h3>
        </div>
        
        <div className="best-times-grid">
          {scheduleSlots.map((slot, index) => {
            const platform = PLATFORMS[slot.platform as keyof typeof PLATFORMS];
            const Icon = platform?.icon;
            const time = new Date(slot.bestTime);
            
            return (
              <div key={index} className="best-time-card">
                <div className="time-platform" ref={(el) => { if (el && platform?.color) el.style.color = platform.color; }}>
                  {Icon && <Icon size={20} />}
                  <span>{platform?.name}</span>
                </div>
                <div className="time-value">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="time-stats">
                  <span className="audience-active">
                    <Users size={12} /> {slot.audienceActive}% active
                  </span>
                  <span className={`competition ${slot.competition}`}>
                    {slot.competition} competition
                  </span>
                </div>
                <button className="btn-schedule-now" title="Schedule post for this time">
                  <Calendar size={14} /> Schedule Now
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render Create Tab - Video Studio
  const renderCreateTab = () => (
    <div className="scc-create">
      {/* Content Type Selection */}
      <div className="create-type-selector">
        <button className="type-btn active" onClick={createShortVideo} title="Create short video for TikTok, Reels, Shorts">
          <Video size={20} />
          <span>Short Video</span>
          <span className="type-desc">TikTok, Reels, Shorts</span>
        </button>
        <button className="type-btn" title="Create image post for feed or stories">
          <ImageIcon size={20} />
          <span>Image Post</span>
          <span className="type-desc">Feed, Stories</span>
        </button>
        <button className="type-btn" title="Create carousel with multiple images">
          <Layers size={20} />
          <span>Carousel</span>
          <span className="type-desc">Multi-image</span>
        </button>
        <button className="type-btn" title="Create text post for Threads or Twitter">
          <FileText size={20} />
          <span>Text Post</span>
          <span className="type-desc">Threads, Twitter</span>
        </button>
      </div>

      {/* Video Editor */}
      <div className="video-editor" data-tour="video-editor">
        {/* Preview Panel */}
        <div className="editor-preview">
          <div className="preview-container aspect-9-16">
            {videoProject?.clips.length ? (
              <video ref={videoRef} className="preview-video" controls />
            ) : (
              <div className="preview-placeholder">
                <Film size={48} />
                <p>Upload media or select from library</p>
                <label className="upload-btn">
                  <Upload size={16} /> Upload Files
                  <input type="file" accept="video/*,image/*" multiple onChange={handleMediaUpload} hidden />
                </label>
              </div>
            )}
          </div>
          
          {/* Preview Controls */}
          <div className="preview-controls">
            <button title="Previous" aria-label="Previous clip"><SkipForward size={16} className="rotate-180" /></button>
            <button className="play-btn" title="Play" aria-label="Play video"><Play size={20} /></button>
            <button title="Next" aria-label="Next clip"><SkipForward size={16} /></button>
            <span className="time-display">0:00 / 0:00</span>
            <button title="Volume" aria-label="Adjust volume"><Volume2 size={16} /></button>
            <button title="Fullscreen" aria-label="Toggle fullscreen"><Maximize2 size={16} /></button>
          </div>
        </div>

        {/* Editor Tools */}
        <div className="editor-tools">
          {/* Media Library */}
          <div className="tool-section">
            <h4><ImageIcon size={16} /> Media</h4>
            <div className="media-grid">
              {mediaFiles.map(media => (
                <div key={media.id} className="media-item">
                  {media.type === 'video' ? (
                    <video src={media.url} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.thumbnail || media.url} alt="" />
                  )}
                  <div className="media-overlay">
                    <button title="Add media" aria-label="Add this media"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
              <label className="media-add">
                <Plus size={20} />
                <input type="file" accept="video/*,image/*" multiple onChange={handleMediaUpload} hidden />
              </label>
            </div>
          </div>

          {/* AI Caption Generator */}
          <div className="tool-section" data-tour="captions-editor">
            <h4><Type size={16} /> AI Captions</h4>
            <div className="caption-tools">
              <button className="btn-ai" onClick={() => generateCaptions(videoProject?.id || '')} title="Auto-generate captions with AI">
                <Sparkles size={14} /> Auto-Generate
              </button>
              <div className="caption-styles">
                {CAPTION_STYLES.map((style, i) => (
                  <button key={i} className="caption-style-btn" ref={(el) => { 
                    if (el) {
                      el.style.fontFamily = style.font;
                      el.style.color = style.color;
                      el.style.backgroundColor = style.background || '';
                    }
                  }}>
                    Aa
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Audio */}
          <div className="tool-section" data-tour="audio-library">
            <h4><Music size={16} /> Trending Audio</h4>
            <div className="audio-list">
              {TRENDING_AUDIO.map(audio => (
                <div key={audio.id} className="audio-item">
                  <button className="audio-play" title="Play audio" aria-label={`Play ${audio.name}`}><Play size={14} /></button>
                  <div className="audio-info">
                    <span className="audio-name">{audio.name}</span>
                    <span className="audio-uses">{formatNumber(audio.uses)} uses</span>
                  </div>
                  <button className="audio-add" title="Add audio" aria-label={`Add ${audio.name} to project`}><Plus size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Effects & Filters */}
          <div className="tool-section">
            <h4><Wand2 size={16} /> Effects</h4>
            <div className="effects-grid">
              <button className="effect-btn" title="Add glow effect">🌟 Glow</button>
              <button className="effect-btn" title="Add flash effect">⚡ Flash</button>
              <button className="effect-btn" title="Add zoom effect">🔄 Zoom</button>
              <button className="effect-btn" title="Add sparkle effect">💫 Sparkle</button>
              <button className="effect-btn" title="Add color effect">🌈 Color</button>
              <button className="effect-btn" title="Add shake effect">📱 Shake</button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="video-timeline" ref={timelineRef} data-tour="video-timeline">
        <div className="timeline-header">
          <span>Timeline</span>
          <div className="timeline-tools">
            <button title="Split clip at playhead"><Scissors size={14} /> Split</button>
            <button title="Duplicate selected clip"><Copy size={14} /> Duplicate</button>
            <button title="Delete selected clip"><X size={14} /> Delete</button>
          </div>
        </div>
        <div className="timeline-tracks">
          <div className="track video-track">
            <span className="track-label">Video</span>
            <div className="track-content">
              {videoProject?.clips.map(clip => (
                <div key={clip.id} className="clip-block" ref={(el) => { if (el) el.style.width = `${(clip.endTime - clip.startTime) * 20}px`; }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={clip.source.thumbnail} alt="" />
                </div>
              ))}
            </div>
          </div>
          <div className="track audio-track">
            <span className="track-label">Audio</span>
            <div className="track-content">
              {videoProject?.audio && (
                <div className="audio-block">
                  <Music size={12} /> {videoProject.audio.name}
                </div>
              )}
            </div>
          </div>
          <div className="track caption-track">
            <span className="track-label">Captions</span>
            <div className="track-content">
              {videoProject?.captions.map(caption => (
                <div key={caption.id} className="caption-block" ref={(el) => { 
                  if (el) {
                    el.style.left = `${caption.startTime * 20}px`;
                    el.style.width = `${(caption.endTime - caption.startTime) * 20}px`;
                  }
                }}>
                  {caption.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render AI Studio Tab
  const renderAIStudio = () => (
    <div className="scc-ai-studio" data-tour="ai-generate">
      {/* AI Content Generator */}
      <div className="ai-generator">
        <div className="ai-header">
          <h3><Bot size={24} /> AI Content Generator</h3>
          <span className="ai-badge"><Sparkles size={14} /> Powered by GPT-5.2</span>
        </div>
        
        <div className="ai-input-section">
          <div className="platform-selector">
            <label>Target Platforms:</label>
            <div className="platform-chips">
              {Object.entries(PLATFORMS).map(([key, platform]) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(key);
                return (
                  <button 
                    key={key}
                    className={`platform-chip ${isSelected ? 'selected' : ''}`}
                    ref={(el) => { if (el && isSelected) el.style.borderColor = platform.color; }}
                    onClick={() => setSelectedPlatforms(prev => 
                      isSelected ? prev.filter(p => p !== key) : [...prev, key]
                    )}
                  >
                    <Icon size={14} />
                    <span>{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="ai-prompt">
            <label>What do you want to create?</label>
            <textarea 
              placeholder="Describe your content idea... e.g., 'A viral TikTok about productivity tips for entrepreneurs'"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="ai-options">
            <div className="option-group">
              <label>Content Type:</label>
              <select title="Select content type" aria-label="Select content type">
                <option>Video Script</option>
                <option>Caption</option>
                <option>Hashtags</option>
                <option>Hook</option>
                <option>Full Post</option>
              </select>
            </div>
            <div className="option-group">
              <label>Tone:</label>
              <select title="Select tone" aria-label="Select tone">
                <option>Professional</option>
                <option>Casual</option>
                <option>Funny</option>
                <option>Inspirational</option>
                <option>Educational</option>
              </select>
            </div>
            <div className="option-group">
              <label>Goal:</label>
              <select title="Select goal" aria-label="Select goal">
                <option>Engagement</option>
                <option>Viral</option>
                <option>Sales</option>
                <option>Brand Awareness</option>
                <option>Education</option>
              </select>
            </div>
          </div>
          
          <button 
            className="btn-generate"
            onClick={() => generateAIContent(currentContent, 'all')}
            disabled={isGenerating || !currentContent}
          >
            {isGenerating ? (
              <><RefreshCw className="spin" size={16} /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate Content</>
            )}
          </button>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="ai-suggestions">
            <h4>Generated Content</h4>
            {aiSuggestions.map(suggestion => (
              <div key={suggestion.id} className="suggestion-card">
                <div className="suggestion-header">
                  <span className="suggestion-type">{suggestion.type}</span>
                  <div className="suggestion-scores" data-tour="viral-score">
                    <span className="confidence">
                      <Target size={12} /> {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                    <span className="viral-score">
                      <Flame size={12} /> {suggestion.viralScore} viral score
                    </span>
                  </div>
                </div>
                <pre className="suggestion-content">{suggestion.content}</pre>
                <div className="suggestion-actions">
                  <button className="btn-use" title="Use this suggestion"><Check size={14} /> Use This</button>
                  <button className="btn-copy" title="Copy to clipboard"><Copy size={14} /> Copy</button>
                  <button className="btn-edit" title="Edit this suggestion"><PenTool size={14} /> Edit</button>
                  <button className="btn-regenerate" title="Generate new suggestion"><RefreshCw size={14} /> Regenerate</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Tools Grid */}
      <div className="ai-tools-grid">
        <div className="ai-tool-card">
          <div className="tool-icon"><Wand2 /></div>
          <h4>Caption Writer</h4>
          <p>Generate engaging captions optimized for each platform</p>
          <button title="Try Caption Writer">Try Now</button>
        </div>
        
        <div className="ai-tool-card">
          <div className="tool-icon"><Hash /></div>
          <h4>Hashtag Generator</h4>
          <p>Find trending and relevant hashtags automatically</p>
          <button title="Try Hashtag Generator">Try Now</button>
        </div>
        
        <div className="ai-tool-card">
          <div className="tool-icon"><Mic /></div>
          <h4>Script Writer</h4>
          <p>Create viral video scripts with proven hooks</p>
          <button title="Try Script Writer">Try Now</button>
        </div>
        
        <div className="ai-tool-card">
          <div className="tool-icon"><RefreshCw /></div>
          <h4>Content Repurposer</h4>
          <p>Transform one piece into 10 platform-specific posts</p>
          <button title="Try Content Repurposer">Try Now</button>
        </div>
        
        <div className="ai-tool-card">
          <div className="tool-icon"><MessageCircle /></div>
          <h4>Reply Generator</h4>
          <p>AI-powered responses to comments and DMs</p>
          <button title="Try Reply Generator">Try Now</button>
        </div>
        
        <div className="ai-tool-card">
          <div className="tool-icon"><TrendingUp /></div>
          <h4>Trend Analyzer</h4>
          <p>Predict viral trends before they peak</p>
          <button title="Try Trend Analyzer">Try Now</button>
        </div>
      </div>
    </div>
  );

  // Render Trends Tab
  const renderTrendsTab = () => (
    <div className="scc-trends">
      <div className="trends-header">
        <h3><Flame size={24} /> Trending Now</h3>
        <div className="trends-filters">
          <select title="Filter by platform" aria-label="Filter trends by platform">
            <option>All Platforms</option>
            <option>TikTok</option>
            <option>Instagram</option>
            <option>YouTube</option>
          </select>
          <select title="Filter by category" aria-label="Filter trends by category">
            <option>All Categories</option>
            <option>Music</option>
            <option>Comedy</option>
            <option>Tech</option>
            <option>Lifestyle</option>
          </select>
        </div>
      </div>

      <div className="trends-grid">
        {trends.map(trend => {
          const platform = PLATFORMS[trend.platform as keyof typeof PLATFORMS];
          const Icon = platform?.icon;
          
          return (
            <div key={trend.id} className="trend-card">
              <div className="trend-platform" ref={(el) => { if (el && platform?.color) el.style.color = platform.color; }}>
                {Icon && <Icon size={16} />}
                <span>{platform?.name}</span>
              </div>
              
              <div className="trend-info">
                <span className={`trend-type ${trend.type}`}>
                  {trend.type === 'audio' && <Music size={12} />}
                  {trend.type === 'hashtag' && <Hash size={12} />}
                  {trend.type === 'challenge' && <Star size={12} />}
                  {trend.type === 'template' && <Layers size={12} />}
                  {trend.type}
                </span>
                <h4>{trend.name}</h4>
              </div>
              
              <div className="trend-stats">
                <div className="stat">
                  <span className="stat-value">{formatNumber(trend.uses)}</span>
                  <span className="stat-label">uses</span>
                </div>
                <div className="stat growth">
                  <TrendingUp size={14} />
                  <span>+{trend.growth}%</span>
                </div>
              </div>
              
              <div className="trend-actions">
                <button className="btn-use-trend" title="Use this trend"><Zap size={14} /> Use Trend</button>
                <button className="btn-save" title="Save trend" aria-label="Save trend for later"><Bookmark size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Viral Predictions */}
      <div className="viral-predictions">
        <h3><Rocket /> AI Viral Predictions</h3>
        <p>Content topics predicted to go viral in the next 24-48 hours</p>
        
        <div className="predictions-list">
          <div className="prediction-item">
            <div className="prediction-rank">1</div>
            <div className="prediction-content">
              <h4>&quot;Day in my life as a...&quot; content format</h4>
              <p>Lifestyle vlogs showing daily routines are surging across platforms</p>
            </div>
            <div className="prediction-score">
              <Flame size={16} />
              <span>95% viral potential</span>
            </div>
          </div>
          
          <div className="prediction-item">
            <div className="prediction-rank">2</div>
            <div className="prediction-content">
              <h4>AI tool demonstrations</h4>
              <p>Tutorials showing AI productivity tools getting high engagement</p>
            </div>
            <div className="prediction-score">
              <Flame size={16} />
              <span>92% viral potential</span>
            </div>
          </div>
          
          <div className="prediction-item">
            <div className="prediction-rank">3</div>
            <div className="prediction-content">
              <h4>Before/After transformations</h4>
              <p>Visual transformation content performing well in Reels/TikTok</p>
            </div>
            <div className="prediction-score">
              <Flame size={16} />
              <span>89% viral potential</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="scc-analytics" data-tour="post-analytics">
      {/* Overview Stats */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="overview-icon"><Eye /></div>
          <div className="overview-content">
            <span className="overview-value">4.2M</span>
            <span className="overview-label">Total Reach (30d)</span>
            <span className="overview-change positive">+24.5%</span>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon"><Heart /></div>
          <div className="overview-content">
            <span className="overview-value">186K</span>
            <span className="overview-label">Total Engagement</span>
            <span className="overview-change positive">+18.2%</span>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon"><Users /></div>
          <div className="overview-content">
            <span className="overview-value">+12.4K</span>
            <span className="overview-label">New Followers</span>
            <span className="overview-change positive">+31.7%</span>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon"><DollarSign /></div>
          <div className="overview-content">
            <span className="overview-value">$8,420</span>
            <span className="overview-label">Est. Revenue</span>
            <span className="overview-change positive">+45.2%</span>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="platform-performance">
        <h3><BarChart3 /> Performance by Platform</h3>
        
        <div className="performance-table">
          <div className="table-header">
            <span>Platform</span>
            <span>Followers</span>
            <span>Engagement</span>
            <span>Reach</span>
            <span>Growth</span>
          </div>
          
          {accounts.map(account => {
            const platform = PLATFORMS[account.platform];
            const Icon = platform?.icon;
            
            return (
              <div key={account.id} className="table-row">
                <div className="platform-cell">
                  {Icon && <Icon size={16} ref={(el: SVGSVGElement | null) => { if (el && platform?.color) el.style.color = platform.color; }} />}
                  <span>{platform?.name}</span>
                </div>
                <span>{formatNumber(account.followers)}</span>
                <span>{account.engagement}%</span>
                <span>{formatNumber(Math.floor(account.followers * 2.5))}</span>
                <span className="growth positive">+{(Math.random() * 20 + 5).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="top-content">
        <h3><Award /> Top Performing Content</h3>
        
        <div className="top-posts-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="top-post-card">
              <div className="post-thumbnail">
                <Video size={24} />
              </div>
              <div className="post-details">
                <span className="post-title">Video #{i} - Viral content</span>
                <div className="post-metrics">
                  <span><Eye size={12} /> {formatNumber(Math.floor(Math.random() * 500000 + 100000))}</span>
                  <span><Heart size={12} /> {formatNumber(Math.floor(Math.random() * 50000 + 10000))}</span>
                  <span><MessageCircle size={12} /> {formatNumber(Math.floor(Math.random() * 5000 + 500))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Schedule Tab
  const renderScheduleTab = () => (
    <div className="scc-schedule">
      <div className="schedule-header">
        <h3><Calendar size={24} /> Content Calendar</h3>
        <div className="schedule-actions">
          <button className="btn-new-post" title="Create a new post"><Plus size={14} /> New Post</button>
          <div className="view-toggle">
            <button className="active" title="Grid view" aria-label="Switch to grid view"><LayoutGrid size={14} /></button>
            <button title="List view" aria-label="Switch to list view"><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        <div className="calendar-header">
          <button title="Previous month" aria-label="Previous month" className="rotate-180"><ChevronRight size={16} /></button>
          <span>December 2025</span>
          <button title="Next month" aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
        
        <div className="calendar-days">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
          
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 6 + 1;
            const hasPost = Math.random() > 0.7;
            
            return (
              <div key={i} className={`calendar-day ${day < 1 || day > 31 ? 'other-month' : ''} ${day === 14 ? 'today' : ''}`}>
                <span className="day-number">{day < 1 ? 30 + day : day > 31 ? day - 31 : day}</span>
                {hasPost && day > 0 && day <= 31 && (
                  <div className="day-posts">
                    <div className="post-indicator" ref={(el) => { if (el) el.style.backgroundColor = PLATFORMS.instagram.color; }}></div>
                    {Math.random() > 0.5 && <div className="post-indicator" ref={(el) => { if (el) el.style.backgroundColor = PLATFORMS.tiktok.color; }}></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Queue */}
      <div className="post-queue">
        <h4>Upcoming Queue</h4>
        <div className="queue-list">
          {posts.filter(p => p.status === 'scheduled').map(post => (
            <div key={post.id} className="queue-item">
              <div className="queue-time">
                <Calendar size={14} />
                {post.scheduledTime?.toLocaleDateString()}
                <Clock size={14} />
                {post.scheduledTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="queue-content">
                <p>{post.content}</p>
                <div className="queue-platforms">
                  {post.platforms.map(p => {
                    const platform = PLATFORMS[p as keyof typeof PLATFORMS];
                    const Icon = platform?.icon;
                    return Icon ? <Icon key={p} size={14} ref={(el: SVGSVGElement | null) => { if (el) el.style.color = platform.color; }} /> : null;
                  })}
                </div>
              </div>
              <div className="queue-actions">
                <button title="Edit post" aria-label="Edit post"><PenTool size={14} /></button>
                <button title="Duplicate post" aria-label="Duplicate post"><Copy size={14} /></button>
                <button title="Delete post" aria-label="Delete post"><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // M5 Initial Loading State
  if (isInitialLoading) {
    return (
      <div className="social-command-center">
        <LoadingState
          variant="spinner"
          size="lg"
          message={t('social.loading.initializing', 'Loading Social Command Center...')}
          description={t('social.loading.connectingAccounts', 'Connecting to your social accounts')}
          testId="social-initial-loading"
        />
      </div>
    );
  }

  // M5 Critical Error State
  if (hasCriticalError) {
    return (
      <div className="social-command-center">
        <ErrorState
          preset="server"
          title={t('social.errors.loadFailed', 'Failed to Load Social Data')}
          message={errorState.accounts || errorState.posts || t('social.errors.tryAgain', 'Please try again later')}
          onRetry={() => {
            handleRetryAccounts();
            handleRetryPosts();
          }}
          retryLabel={t('common.retry', 'Retry')}
          testId="social-critical-error"
        />
      </div>
    );
  }

  return (
    <div className="social-command-center">
      {/* Header */}
      <div className="scc-header">
        <div className="scc-title">
          <Crown className="crown-icon" />
          <h1>{t('social.title', 'Social Command Center')}</h1>
          <span className="scc-badge">{t('social.badge.pro', 'PRO')}</span>
        </div>
        
        <div className="scc-tabs" data-tour="social-tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title={t('social.tabs.dashboard', 'View dashboard overview')}
          >
            <LayoutGrid size={16} /> {t('social.tabs.dashboardLabel', 'Dashboard')}
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            data-tour="create-content"
            title={t('social.tabs.create', 'Create new content')}
          >
            <Video size={16} /> {t('social.tabs.createLabel', 'Create')}
          </button>
          <button 
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
            data-tour="content-calendar"
            title="View content schedule"
          >
            <Calendar size={16} /> Schedule
          </button>
          <button 
            className={`tab ${activeTab === 'ai-studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-studio')}
            data-tour="ai-studio"
            title={t('social.tabs.aiStudio', 'Open AI Studio')}
          >
            <Sparkles size={16} /> {t('social.tabs.aiStudioLabel', 'AI Studio')}
          </button>
          <button 
            className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
            data-tour="trends-section"
            title={t('social.tabs.trends', 'View trending content')}
          >
            <Flame size={16} /> {t('social.tabs.trendsLabel', 'Trends')}
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            data-tour="analytics-dashboard"
            title={t('social.tabs.analytics', 'View analytics')}
          >
            <BarChart3 size={16} /> {t('social.tabs.analyticsLabel', 'Analytics')}
          </button>
        </div>

        <div className="scc-actions">
          <button className="btn-quick-post" title={t('social.actions.quickPost', 'Create a quick post')}>
            <Plus size={16} /> {t('social.actions.quickPostLabel', 'Quick Post')}
          </button>
          <button className="btn-notifications" title={t('social.actions.notifications', 'View notifications')}>
            <Bell size={16} />
            <span className="notification-badge">3</span>
          </button>
          <button 
            className="btn-tour-help"
            onClick={() => startTour()}
            title={t('social.actions.tour', 'Start guided tour')}
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Main Content with M5 State Handling */}
      <div className="scc-content">
        {activeTab === 'dashboard' && (
          errorState.accounts ? (
            <ErrorState
              preset="network"
              title={t('social.errors.accountsLoadFailed', 'Failed to load accounts')}
              message={errorState.accounts}
              onRetry={handleRetryAccounts}
              retryLabel={t('common.retry', 'Retry')}
              testId="social-accounts-error"
            />
          ) : loadingState.accounts ? (
            <LoadingState
              variant="dots"
              size="md"
              message={t('social.loading.accounts', 'Loading accounts...')}
              testId="social-accounts-loading"
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              preset="noFiles"
              title={t('social.empty.noAccounts', 'No Social Accounts Connected')}
              description={t('social.empty.noAccountsDesc', 'Connect your first social media account to start managing your content.')}
              action={{
                label: t('social.empty.connectAccount', 'Connect Account'),
                onClick: () => setShowAccountModal(true)
              }}
              testId="social-accounts-empty"
            />
          ) : (
            renderDashboard()
          )
        )}
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'schedule' && (
          errorState.posts ? (
            <ErrorState
              preset="network"
              title={t('social.errors.postsLoadFailed', 'Failed to load scheduled posts')}
              message={errorState.posts}
              onRetry={handleRetryPosts}
              retryLabel={t('common.retry', 'Retry')}
              testId="social-posts-error"
            />
          ) : loadingState.posts ? (
            <LoadingState
              variant="dots"
              size="md"
              message={t('social.loading.posts', 'Loading scheduled posts...')}
              testId="social-posts-loading"
            />
          ) : posts.length === 0 ? (
            <EmptyState
              preset="search"
              title={t('social.empty.noPosts', 'No Scheduled Posts')}
              description={t('social.empty.noPostsDesc', 'Create and schedule your first post to see it here.')}
              action={{
                label: t('social.empty.createPost', 'Create Post'),
                onClick: () => setActiveTab('create')
              }}
              testId="social-posts-empty"
            />
          ) : (
            renderScheduleTab()
          )
        )}
        {activeTab === 'ai-studio' && renderAIStudio()}
        {activeTab === 'trends' && (
          errorState.trends ? (
            <ErrorState
              preset="network"
              title={t('social.errors.trendsLoadFailed', 'Failed to load trends')}
              message={errorState.trends}
              onRetry={handleRetryTrends}
              retryLabel={t('common.retry', 'Retry')}
              testId="social-trends-error"
            />
          ) : loadingState.trends ? (
            <LoadingState
              variant="dots"
              size="md"
              message={t('social.loading.trends', 'Loading trending content...')}
              testId="social-trends-loading"
            />
          ) : trends.length === 0 ? (
            <EmptyState
              preset="default"
              title={t('social.empty.noTrends', 'No Trending Content Available')}
              description={t('social.empty.noTrendsDesc', 'Check back later for the latest trends.')}
              testId="social-trends-empty"
            />
          ) : (
            renderTrendsTab()
          )
        )}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Account Connection Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Social Account</h3>
              <button onClick={() => setShowAccountModal(false)} title="Close modal" aria-label="Close modal"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Select a platform to connect:</p>
              <div className="platforms-list">
                {Object.entries(PLATFORMS).map(([key, platform]) => {
                  const Icon = platform.icon;
                  const isConnected = accounts.some(a => a.platform === key);
                  
                  return (
                    <button 
                      key={key} 
                      className={`platform-btn ${isConnected ? 'connected' : ''}`}
                      disabled={isConnected}
                      title={isConnected ? `${platform.name} already connected` : `Connect ${platform.name}`}
                    >
                      <Icon size={24} ref={(el: SVGSVGElement | null) => { if (el) el.style.color = platform.color; }} />
                      <span>{platform.name}</span>
                      {isConnected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialCommandCenter;
