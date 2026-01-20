"use client";

import React, { useState } from 'react';
import {
  TrendingUp, PieChart, LineChart,
  Users, Eye, Heart, Share2,
  Clock, Target, Zap, Crown,
  ArrowUp, ArrowDown, Minus, Download,
  RefreshCw, Video, Sparkles,
  LucideIcon
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import './analytics.css';

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  changeType: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: string;
}

interface TopContent {
  id: string;
  platform: string;
  type: 'video' | 'image' | 'carousel' | 'story' | 'reel';
  thumbnail: string;
  title: string;
  views: number;
  engagement: number;
  virality: number;
  shares: number;
  postedAt: Date;
}

interface PlatformStats {
  platform: string;
  icon: string;
  followers: number;
  growth: number;
  engagement: number;
  reach: number;
  impressions: number;
  bestTime: string;
  topHashtags: string[];
}

export default function ViralAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const metrics: MetricCard[] = [
    { label: 'Total Reach', value: '2.4M', change: 34, changeType: 'up', icon: Eye, color: '#3b82f6' },
    { label: 'Engagement Rate', value: '8.7%', change: 2.3, changeType: 'up', icon: Heart, color: '#ef4444' },
    { label: 'Total Followers', value: '487K', change: 12, changeType: 'up', icon: Users, color: '#8b5cf6' },
    { label: 'Virality Score', value: '94', change: 5, changeType: 'up', icon: Zap, color: '#f59e0b' },
    { label: 'Content Shares', value: '156K', change: 28, changeType: 'up', icon: Share2, color: '#10b981' },
    { label: 'Avg. Watch Time', value: '2:34', change: -4, changeType: 'down', icon: Clock, color: '#ec4899' },
  ];

  const platformStats: PlatformStats[] = [
    {
      platform: 'Instagram',
      icon: '📸',
      followers: 145000,
      growth: 8.5,
      engagement: 9.2,
      reach: 890000,
      impressions: 2100000,
      bestTime: '6:00 PM - 9:00 PM',
      topHashtags: ['#viral', '#trending', '#reels']
    },
    {
      platform: 'TikTok',
      icon: '🎵',
      followers: 230000,
      growth: 24.3,
      engagement: 12.8,
      reach: 1400000,
      impressions: 4500000,
      bestTime: '7:00 PM - 10:00 PM',
      topHashtags: ['#fyp', '#foryou', '#viral']
    },
    {
      platform: 'YouTube',
      icon: '▶️',
      followers: 89000,
      growth: 5.2,
      engagement: 4.5,
      reach: 340000,
      impressions: 890000,
      bestTime: '2:00 PM - 4:00 PM',
      topHashtags: ['#shorts', '#subscribe', '#howto']
    },
    {
      platform: 'Twitter/X',
      icon: '𝕏',
      followers: 23000,
      growth: -2.1,
      engagement: 3.8,
      reach: 120000,
      impressions: 450000,
      bestTime: '8:00 AM - 10:00 AM',
      topHashtags: ['#tech', '#ai', '#trending']
    }
  ];

  const topContent: TopContent[] = [
    {
      id: '1',
      platform: 'TikTok',
      type: 'video',
      thumbnail: '/api/placeholder/120/160',
      title: 'How I grew 100K followers in 30 days',
      views: 2400000,
      engagement: 18.5,
      virality: 98,
      shares: 45000,
      postedAt: new Date('2025-01-15')
    },
    {
      id: '2',
      platform: 'Instagram',
      type: 'reel',
      thumbnail: '/api/placeholder/120/160',
      title: '5 AI tools that changed my workflow',
      views: 890000,
      engagement: 12.3,
      virality: 92,
      shares: 23000,
      postedAt: new Date('2025-01-18')
    },
    {
      id: '3',
      platform: 'YouTube',
      type: 'video',
      thumbnail: '/api/placeholder/120/160',
      title: 'The SECRET to viral shorts (revealed)',
      views: 456000,
      engagement: 8.7,
      virality: 85,
      shares: 12000,
      postedAt: new Date('2025-01-20')
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getChangeIcon = (type: 'up' | 'down' | 'neutral') => {
    switch (type) {
      case 'up': return <ArrowUp className="change-icon up" size={14} />;
      case 'down': return <ArrowDown className="change-icon down" size={14} />;
      default: return <Minus className="change-icon neutral" size={14} />;
    }
  };

  return (
    <AppLayout>
      <div className="viral-analytics">
        {/* Header */}
        <header className="analytics-header">
          <div className="header-left">
            <h1>
              <TrendingUp size={28} />
              Viral Analytics
            </h1>
            <p>Deep insights into your content performance across all platforms</p>
          </div>
          <div className="header-right">
            <div className="time-range-selector">
            {(['7d', '30d', '90d', 'year'] as const).map(range => (
              <button
                key={range}
                className={timeRange === range ? 'active' : ''}
                onClick={() => setTimeRange(range)}
              >
                {range === 'year' ? '1Y' : range}
              </button>
            ))}
          </div>
          <select 
            className="platform-filter"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter/X</option>
          </select>
          <button className="refresh-btn">
            <RefreshCw size={18} />
          </button>
          <button className="export-btn">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="metric-card">
                <div className="metric-icon" style={{ background: `${metric.color}20`, color: metric.color }}>
                  <Icon size={24} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">{metric.value}</span>
                  <div className={`metric-change ${metric.changeType}`}>
                    {getChangeIcon(metric.changeType)}
                    <span>{Math.abs(metric.change)}%</span>
                    <span className="change-period">vs last period</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Content */}
      <div className="analytics-content">
        {/* Left Column */}
        <div className="analytics-left">
          {/* Performance Chart */}
          <section className="chart-section">
            <div className="section-header">
              <h2><LineChart size={20} /> Performance Over Time</h2>
              <div className="chart-toggles">
                <button className="active">Reach</button>
                <button>Engagement</button>
                <button>Followers</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {Array.from({ length: 30 }, (_, i) => (
                  <div 
                    key={i} 
                    className="chart-bar"
                    style={{ 
                      height: `${20 + Math.random() * 80}%`,
                      background: `linear-gradient(to top, #8b5cf6, #6366f1)`
                    }}
                  />
                ))}
              </div>
              <div className="chart-labels">
                <span>Jan 1</span>
                <span>Jan 8</span>
                <span>Jan 15</span>
                <span>Jan 22</span>
                <span>Jan 29</span>
              </div>
            </div>
          </section>

          {/* Top Performing Content */}
          <section className="top-content-section">
            <div className="section-header">
              <h2><Crown size={20} /> Top Performing Content</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="top-content-list">
              {topContent.map((content, idx) => (
                <div key={content.id} className="content-item">
                  <div className="content-rank">#{idx + 1}</div>
                  <div className="content-thumbnail">
                    <div className="thumb-placeholder">
                      <Video size={24} />
                    </div>
                    <span className="content-platform">{content.platform}</span>
                  </div>
                  <div className="content-info">
                    <h3>{content.title}</h3>
                    <div className="content-stats">
                      <span><Eye size={14} /> {formatNumber(content.views)}</span>
                      <span><Heart size={14} /> {content.engagement}%</span>
                      <span><Share2 size={14} /> {formatNumber(content.shares)}</span>
                    </div>
                  </div>
                  <div className="content-virality">
                    <div className="virality-score" style={{ 
                      background: content.virality > 90 ? 'linear-gradient(135deg, #10b981, #059669)' :
                                 content.virality > 70 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                 'linear-gradient(135deg, #ef4444, #dc2626)'
                    }}>
                      <Zap size={14} />
                      {content.virality}
                    </div>
                    <span className="virality-label">Virality</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Insights */}
          <section className="ai-insights-section">
            <div className="section-header">
              <h2><Sparkles size={20} /> AI Insights</h2>
              <span className="ai-badge">Powered by GPT-5.2</span>
            </div>
            <div className="insights-grid">
              <div className="insight-card success">
                <div className="insight-icon">🚀</div>
                <div className="insight-content">
                  <h4>Best Posting Time</h4>
                  <p>Your audience is most active between 6-9 PM EST. Videos posted during this window get 47% more engagement.</p>
                </div>
              </div>
              <div className="insight-card warning">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <h4>Trending Topic Alert</h4>
                  <p>#AITools is trending in your niche. Create content around this topic within the next 24 hours for maximum impact.</p>
                </div>
              </div>
              <div className="insight-card info">
                <div className="insight-icon">📈</div>
                <div className="insight-content">
                  <h4>Content Recommendation</h4>
                  <p>Your tutorial-style videos perform 3.2x better than other formats. Consider creating more educational content.</p>
                </div>
              </div>
              <div className="insight-card highlight">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h4>Audience Growth</h4>
                  <p>You&apos;re gaining followers 24% faster than similar accounts. Your hook rate in the first 3 seconds is exceptional.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="analytics-right">
          {/* Platform Breakdown */}
          <section className="platform-section">
            <div className="section-header">
              <h2><PieChart size={20} /> Platform Breakdown</h2>
            </div>
            <div className="platform-list">
              {platformStats.map((platform) => (
                <div key={platform.platform} className="platform-card">
                  <div className="platform-header">
                    <span className="platform-icon">{platform.icon}</span>
                    <span className="platform-name">{platform.platform}</span>
                    <span className={`platform-growth ${platform.growth >= 0 ? 'positive' : 'negative'}`}>
                      {platform.growth >= 0 ? '+' : ''}{platform.growth}%
                    </span>
                  </div>
                  <div className="platform-stats">
                    <div className="stat">
                      <Users size={14} />
                      <span>{formatNumber(platform.followers)}</span>
                    </div>
                    <div className="stat">
                      <Eye size={14} />
                      <span>{formatNumber(platform.reach)}</span>
                    </div>
                    <div className="stat">
                      <Heart size={14} />
                      <span>{platform.engagement}%</span>
                    </div>
                  </div>
                  <div className="platform-best-time">
                    <Clock size={12} />
                    <span>Best: {platform.bestTime}</span>
                  </div>
                  <div className="platform-hashtags">
                    {platform.topHashtags.map((tag, i) => (
                      <span key={i} className="hashtag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Audience Demographics */}
          <section className="demographics-section">
            <div className="section-header">
              <h2><Users size={20} /> Audience</h2>
            </div>
            <div className="demographics-content">
              <div className="demo-item">
                <span className="demo-label">Age Group</span>
                <div className="demo-bars">
                  <div className="demo-bar" style={{ width: '45%' }}>
                    <span>18-24</span>
                    <span>45%</span>
                  </div>
                  <div className="demo-bar" style={{ width: '32%' }}>
                    <span>25-34</span>
                    <span>32%</span>
                  </div>
                  <div className="demo-bar" style={{ width: '15%' }}>
                    <span>35-44</span>
                    <span>15%</span>
                  </div>
                  <div className="demo-bar" style={{ width: '8%' }}>
                    <span>45+</span>
                    <span>8%</span>
                  </div>
                </div>
              </div>
              <div className="demo-item">
                <span className="demo-label">Top Locations</span>
                <div className="location-list">
                  <div className="location">
                    <span>🇺🇸 United States</span>
                    <span>42%</span>
                  </div>
                  <div className="location">
                    <span>🇬🇧 United Kingdom</span>
                    <span>18%</span>
                  </div>
                  <div className="location">
                    <span>🇨🇦 Canada</span>
                    <span>12%</span>
                  </div>
                  <div className="location">
                    <span>🇦🇺 Australia</span>
                    <span>8%</span>
                  </div>
                </div>
              </div>
              <div className="demo-item">
                <span className="demo-label">Gender</span>
                <div className="gender-chart">
                  <div className="gender-bar female" style={{ width: '54%' }}>54%</div>
                  <div className="gender-bar male" style={{ width: '44%' }}>44%</div>
                  <div className="gender-bar other" style={{ width: '2%' }}>2%</div>
                </div>
              </div>
            </div>
          </section>

          {/* Competitor Analysis */}
          <section className="competitor-section">
            <div className="section-header">
              <h2><Target size={20} /> Competitor Watch</h2>
            </div>
            <div className="competitor-list">
              <div className="competitor-item">
                <div className="competitor-avatar">C1</div>
                <div className="competitor-info">
                  <span className="competitor-name">@competitor1</span>
                  <span className="competitor-followers">1.2M followers</span>
                </div>
                <div className="competitor-diff positive">+12% faster</div>
              </div>
              <div className="competitor-item">
                <div className="competitor-avatar">C2</div>
                <div className="competitor-info">
                  <span className="competitor-name">@competitor2</span>
                  <span className="competitor-followers">890K followers</span>
                </div>
                <div className="competitor-diff positive">+8% faster</div>
              </div>
              <div className="competitor-item">
                <div className="competitor-avatar">C3</div>
                <div className="competitor-info">
                  <span className="competitor-name">@competitor3</span>
                  <span className="competitor-followers">2.1M followers</span>
                </div>
                <div className="competitor-diff negative">-5% slower</div>
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
