/**
 * Social Command Center Tour Steps - CUBE Nexum
 * 
 * Comprehensive guided tour for the Social Media Management platform with:
 * - Multi-platform account management
 * - Content creation and scheduling
 * - Video editing (Reels/TikTok/Shorts)
 * - AI-powered content generation
 * - Analytics and trending insights
 * 
 * Total: 6 sections, ~30 steps, ~35 minutes
 */

import { TourStep, TourSection } from '../../tour/types';

// ============================================
// Section 1: Welcome & Overview
// ============================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'social-welcome',
    title: 'Welcome to Social Command Center',
    content: `
      <p>Your complete social media management hub:</p>
      <ul>
        <li><strong>Multi-Platform</strong> - Instagram, TikTok, YouTube, X, LinkedIn</li>
        <li><strong>Content Studio</strong> - Create posts, reels, and stories</li>
        <li><strong>AI Assistant</strong> - Generate viral content with AI</li>
        <li><strong>Video Editor</strong> - Built-in short-form video editor</li>
        <li><strong>Analytics</strong> - Track performance across all platforms</li>
      </ul>
      <p>Let's explore your social media powerhouse!</p>
    `,
    category: 'welcome',
    targetSelector: '.social-command-center',
    position: 'center',
    highlightType: 'none',
  },
  {
    id: 'social-tabs',
    title: 'Navigation Tabs',
    content: `
      <p>Navigate between different sections:</p>
      <ul>
        <li><strong>Dashboard</strong> - Overview and quick stats</li>
        <li><strong>Create</strong> - New posts and content</li>
        <li><strong>Schedule</strong> - Content calendar</li>
        <li><strong>Analytics</strong> - Performance metrics</li>
        <li><strong>AI Studio</strong> - AI-powered creation</li>
        <li><strong>Trends</strong> - What's viral now</li>
      </ul>
    `,
    category: 'welcome',
    targetSelector: '[data-tour="social-tabs"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 2: Account Management
// ============================================

export const accountSteps: TourStep[] = [
  {
    id: 'social-accounts',
    title: 'Connected Accounts',
    content: `
      <p>View all your connected social accounts:</p>
      <ul>
        <li>Profile picture and username</li>
        <li>Follower count and engagement rate</li>
        <li>Last sync time</li>
        <li>Connection status</li>
      </ul>
      <p>Click an account to see platform-specific analytics.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="accounts-list"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'social-connect',
    title: 'Connect New Account',
    content: `
      <p>Add more social accounts:</p>
      <ol>
        <li>Click "Connect Account"</li>
        <li>Select the platform</li>
        <li>Authorize CUBE access</li>
        <li>Start posting!</li>
      </ol>
      <p>Supports: Instagram, TikTok, YouTube, X, LinkedIn, Facebook, Pinterest, Threads.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="connect-account-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'social-sync',
    title: 'Sync Accounts',
    content: `
      <p>Keep your data up to date:</p>
      <ul>
        <li><strong>Auto-sync</strong> - Updates every hour</li>
        <li><strong>Manual sync</strong> - Click sync icon</li>
        <li><strong>Full refresh</strong> - Pull all historical data</li>
      </ul>
      <p>Sync fetches latest followers, engagement, and post performance.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="sync-btn"]',
    position: 'left',
    highlightType: 'pulse',
  },
];

// ============================================
// Section 3: Content Creation
// ============================================

export const contentCreationSteps: TourStep[] = [
  {
    id: 'social-create-post',
    title: 'Create New Content',
    content: `
      <p>Start creating engaging content:</p>
      <ul>
        <li><strong>Post</strong> - Standard feed posts</li>
        <li><strong>Reel/Short</strong> - Vertical video</li>
        <li><strong>Story</strong> - 24-hour content</li>
        <li><strong>Carousel</strong> - Multiple images/videos</li>
        <li><strong>Thread</strong> - Multi-part posts</li>
      </ul>
      <p>Select your content type to begin.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="create-content"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'social-editor',
    title: 'Content Editor',
    content: `
      <p>Craft your message:</p>
      <ul>
        <li>Write your caption</li>
        <li>Add emojis 😎</li>
        <li>Insert hashtags #viral</li>
        <li>Tag accounts @mention</li>
      </ul>
      <p>Character count shows limits for each platform.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="content-editor"]',
    position: 'right',
    highlightType: 'border',
  },
  {
    id: 'social-media-upload',
    title: 'Media Library',
    content: `
      <p>Add visual content:</p>
      <ul>
        <li><strong>Upload</strong> - Images, videos, GIFs</li>
        <li><strong>Stock</strong> - Free stock images</li>
        <li><strong>Create</strong> - Design with templates</li>
        <li><strong>AI Generate</strong> - Create with AI</li>
      </ul>
      <p>Drag and drop or click to upload.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="media-upload"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'social-platforms-select',
    title: 'Platform Selection',
    content: `
      <p>Choose where to publish:</p>
      <ul>
        <li>Select multiple platforms at once</li>
        <li>Content adapts to each platform's format</li>
        <li>Preview how it looks on each</li>
      </ul>
      <p>Cross-post to reach your entire audience.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="platform-select"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'social-hashtags',
    title: 'Smart Hashtags',
    content: `
      <p>Optimize your reach with hashtags:</p>
      <ul>
        <li><strong>Suggestions</strong> - AI-recommended tags</li>
        <li><strong>Trending</strong> - What's hot now</li>
        <li><strong>Saved</strong> - Your hashtag sets</li>
        <li><strong>Performance</strong> - See which work best</li>
      </ul>
      <p>Mix popular and niche hashtags for best results.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="hashtag-section"]',
    position: 'left',
    highlightType: 'border',
  },
];

// ============================================
// Section 4: Video Editor
// ============================================

export const videoEditorSteps: TourStep[] = [
  {
    id: 'social-video-editor',
    title: 'Video Studio',
    content: `
      <p>Create professional short-form videos:</p>
      <ul>
        <li><strong>Reels</strong> - Instagram vertical video</li>
        <li><strong>TikTok</strong> - Full creative suite</li>
        <li><strong>Shorts</strong> - YouTube short videos</li>
        <li><strong>Stories</strong> - 15-second clips</li>
      </ul>
      <p>Built-in editor with trending effects and sounds.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="video-editor"]',
    position: 'center',
    highlightType: 'spotlight',
  },
  {
    id: 'social-timeline',
    title: 'Video Timeline',
    content: `
      <p>Edit your clips on the timeline:</p>
      <ul>
        <li>Drag clips to reorder</li>
        <li>Trim start/end points</li>
        <li>Add transitions between clips</li>
        <li>Layer audio tracks</li>
      </ul>
      <p>Precision editing for viral content.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="video-timeline"]',
    position: 'top',
    highlightType: 'border',
  },
  {
    id: 'social-audio-library',
    title: 'Trending Audio',
    content: `
      <p>Add viral sounds to your videos:</p>
      <ul>
        <li><strong>Trending</strong> - Most used sounds</li>
        <li><strong>Categories</strong> - Music, effects, voices</li>
        <li><strong>Upload</strong> - Your own audio</li>
        <li><strong>Voiceover</strong> - Record narration</li>
      </ul>
      <p>Using trending audio boosts discoverability!</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="audio-library"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'social-captions',
    title: 'Auto Captions',
    content: `
      <p>Add engaging captions:</p>
      <ul>
        <li><strong>Auto-generate</strong> - AI transcription</li>
        <li><strong>Styles</strong> - Animated text effects</li>
        <li><strong>Timing</strong> - Sync with speech</li>
        <li><strong>Edit</strong> - Customize each word</li>
      </ul>
      <p>Captions increase watch time by 40%!</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="captions-editor"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 5: Scheduling & Analytics
// ============================================

export const schedulingAnalyticsSteps: TourStep[] = [
  {
    id: 'social-calendar',
    title: 'Content Calendar',
    content: `
      <p>Plan your content strategy:</p>
      <ul>
        <li>Visual calendar view</li>
        <li>Drag posts to reschedule</li>
        <li>Color-coded by platform</li>
        <li>Optimal time suggestions</li>
      </ul>
      <p>Consistency is key to social media success.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="content-calendar"]',
    position: 'center',
    highlightType: 'spotlight',
  },
  {
    id: 'social-best-times',
    title: 'Best Posting Times',
    content: `
      <p>Post when your audience is active:</p>
      <ul>
        <li><strong>AI Analysis</strong> - Based on your data</li>
        <li><strong>Platform-specific</strong> - Each network differs</li>
        <li><strong>Time zones</strong> - Global audience support</li>
        <li><strong>Competition</strong> - Avoid crowded times</li>
      </ul>
      <p>Green slots = your best times to post.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="best-times"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'social-analytics-dashboard',
    title: 'Analytics Dashboard',
    content: `
      <p>Track your performance:</p>
      <ul>
        <li><strong>Followers</strong> - Growth over time</li>
        <li><strong>Engagement</strong> - Likes, comments, shares</li>
        <li><strong>Reach</strong> - How many see your content</li>
        <li><strong>Top Posts</strong> - Your best performers</li>
      </ul>
      <p>Data-driven decisions lead to better results.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="analytics-dashboard"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'social-post-analytics',
    title: 'Post Performance',
    content: `
      <p>Analyze individual posts:</p>
      <ul>
        <li>Engagement rate vs. average</li>
        <li>Best performing hashtags</li>
        <li>Audience demographics</li>
        <li>Peak engagement time</li>
      </ul>
      <p>Learn what works and replicate success.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="post-analytics"]',
    position: 'left',
    highlightType: 'border',
  },
];

// ============================================
// Section 6: AI Studio & Trends
// ============================================

export const aiTrendsSteps: TourStep[] = [
  {
    id: 'social-ai-studio',
    title: 'AI Content Studio',
    content: `
      <p>Let AI supercharge your content:</p>
      <ul>
        <li><strong>Caption Generator</strong> - Engaging captions</li>
        <li><strong>Hashtag Finder</strong> - Trending tags</li>
        <li><strong>Hook Writer</strong> - Viral video hooks</li>
        <li><strong>Script Generator</strong> - Full video scripts</li>
      </ul>
      <p>AI trained on viral content patterns.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="ai-studio"]',
    position: 'center',
    highlightType: 'spotlight',
  },
  {
    id: 'social-ai-generate',
    title: 'Generate Content',
    content: `
      <p>Create with AI in seconds:</p>
      <ol>
        <li>Describe your topic</li>
        <li>Select content type</li>
        <li>Choose tone/style</li>
        <li>Generate variations</li>
      </ol>
      <p>Edit and refine AI suggestions to match your voice.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="ai-generate"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'social-trends',
    title: 'Trending Now',
    content: `
      <p>Stay on top of what's viral:</p>
      <ul>
        <li><strong>Sounds</strong> - Trending audio clips</li>
        <li><strong>Hashtags</strong> - Rising tags</li>
        <li><strong>Challenges</strong> - Viral trends</li>
        <li><strong>Templates</strong> - Popular formats</li>
      </ul>
      <p>Jump on trends early for maximum reach.</p>
    `,
    category: 'tips',
    targetSelector: '[data-tour="trends-section"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'social-viral-score',
    title: 'Viral Potential Score',
    content: `
      <p>AI predicts your content's viral potential:</p>
      <ul>
        <li><strong>0-40</strong> - Low engagement expected</li>
        <li><strong>40-70</strong> - Average performance</li>
        <li><strong>70-90</strong> - High viral potential</li>
        <li><strong>90+</strong> - Potential breakout hit!</li>
      </ul>
      <p>Optimize your content before posting.</p>
    `,
    category: 'tips',
    targetSelector: '[data-tour="viral-score"]',
    position: 'left',
    highlightType: 'pulse',
  },
  {
    id: 'social-complete',
    title: '🎉 Social Command Center Tour Complete!',
    content: `
      <p>You're ready to dominate social media!</p>
      <p><strong>Key takeaways:</strong></p>
      <ul>
        <li>Connect all your accounts in one place</li>
        <li>Use AI to create engaging content</li>
        <li>Schedule posts at optimal times</li>
        <li>Track analytics to improve</li>
        <li>Jump on trends early</li>
      </ul>
      <p>Go viral! 🚀</p>
    `,
    category: 'welcome',
    targetSelector: '.social-command-center',
    position: 'center',
    highlightType: 'glow',
  },
];

// ============================================
// Export All Steps
// ============================================

export const allSocialTourSteps: TourStep[] = [
  ...welcomeSteps,
  ...accountSteps,
  ...contentCreationSteps,
  ...videoEditorSteps,
  ...schedulingAnalyticsSteps,
  ...aiTrendsSteps,
];

export const allSocialTourSections: TourSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to Social Command Center',
    steps: welcomeSteps,
    icon: '👋',
    category: 'welcome',
    estimatedMinutes: 3,
    difficulty: 'beginner',
  },
  {
    id: 'accounts',
    title: 'Account Management',
    description: 'Connect and manage social accounts',
    steps: accountSteps,
    icon: '👤',
    category: 'settings',
    estimatedMinutes: 5,
    difficulty: 'beginner',
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Create engaging posts and media',
    steps: contentCreationSteps,
    icon: '✨',
    category: 'campaigns',
    estimatedMinutes: 8,
    difficulty: 'beginner',
  },
  {
    id: 'video-editor',
    title: 'Video Studio',
    description: 'Create professional short-form videos',
    steps: videoEditorSteps,
    icon: '🎬',
    category: 'advanced',
    estimatedMinutes: 8,
    difficulty: 'intermediate',
  },
  {
    id: 'scheduling-analytics',
    title: 'Schedule & Analytics',
    description: 'Plan content and track performance',
    steps: schedulingAnalyticsSteps,
    icon: '📊',
    category: 'analytics',
    estimatedMinutes: 6,
    difficulty: 'beginner',
  },
  {
    id: 'ai-trends',
    title: 'AI Studio & Trends',
    description: 'AI content generation and viral trends',
    steps: aiTrendsSteps,
    icon: '🤖',
    category: 'advanced',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
  },
];

// ============================================
// Tour Statistics
// ============================================

export const socialTourStats = {
  totalSteps: allSocialTourSteps.length,
  totalSections: allSocialTourSections.length,
  estimatedMinutes: allSocialTourSections.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0),
  features: [
    'Multi-platform posting',
    'AI content generation',
    'Short-form video editor',
    'Content calendar',
    'Analytics dashboard',
    'Trending sounds & hashtags',
    'Viral potential scoring',
    'Auto-captions',
    'Optimal posting times',
    'Cross-platform publishing',
  ],
};
