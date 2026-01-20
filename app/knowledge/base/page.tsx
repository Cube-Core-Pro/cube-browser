'use client';

import React, { useState } from 'react';
import { 
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Printer,
  ExternalLink,
  Folder,
  FileText,
  Video,
  Code,
  Terminal,
  Zap,
  Settings,
  Users,
  Shield,
  CreditCard,
  Globe,
  Database,
  ArrowRight,
  ArrowLeft,
  Home,
  Menu,
  X
} from 'lucide-react';
import './knowledge.css';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  subcategory: string;
  readTime: string;
  views: number;
  helpful: number;
  lastUpdated: string;
  type: 'article' | 'video' | 'tutorial';
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  articleCount: number;
  subcategories: string[];
}

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['getting-started']);
  const [showSidebar, setShowSidebar] = useState(true);

  const categories: Category[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <Zap size={20} />,
      description: 'Quick start guides and tutorials',
      articleCount: 12,
      subcategories: ['Installation', 'First Steps', 'Quick Start', 'Concepts']
    },
    {
      id: 'automation',
      name: 'Automation',
      icon: <Terminal size={20} />,
      description: 'Build and manage automations',
      articleCount: 24,
      subcategories: ['Workflows', 'Selectors', 'Actions', 'Triggers', 'Scheduling']
    },
    {
      id: 'api',
      name: 'API & Developers',
      icon: <Code size={20} />,
      description: 'API reference and SDK guides',
      articleCount: 18,
      subcategories: ['Authentication', 'Endpoints', 'SDKs', 'Webhooks', 'Rate Limits']
    },
    {
      id: 'team',
      name: 'Team Management',
      icon: <Users size={20} />,
      description: 'Collaborate with your team',
      articleCount: 10,
      subcategories: ['Invitations', 'Roles', 'Permissions', 'Activity']
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Shield size={20} />,
      description: 'Security best practices',
      articleCount: 15,
      subcategories: ['SSO', '2FA', 'Audit Logs', 'Compliance', 'Data Protection']
    },
    {
      id: 'billing',
      name: 'Billing & Plans',
      icon: <CreditCard size={20} />,
      description: 'Subscriptions and payments',
      articleCount: 8,
      subcategories: ['Plans', 'Payments', 'Invoices', 'Upgrades']
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: <Globe size={20} />,
      description: 'Connect with other tools',
      articleCount: 22,
      subcategories: ['Zapier', 'Slack', 'Google', 'Salesforce', 'Custom']
    },
    {
      id: 'data',
      name: 'Data Management',
      icon: <Database size={20} />,
      description: 'Import, export, and manage data',
      articleCount: 14,
      subcategories: ['Import', 'Export', 'Backup', 'Storage']
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'Quick Start Guide: Your First Automation',
      excerpt: 'Learn how to create your first automation workflow in under 10 minutes with this step-by-step guide.',
      category: 'getting-started',
      subcategory: 'Quick Start',
      readTime: '10 min',
      views: 15420,
      helpful: 1234,
      lastUpdated: '2 days ago',
      type: 'tutorial'
    },
    {
      id: '2',
      title: 'Understanding Selectors: A Complete Guide',
      excerpt: 'Master CSS selectors for reliable web automation. Learn about different selector types and best practices.',
      category: 'automation',
      subcategory: 'Selectors',
      readTime: '15 min',
      views: 12350,
      helpful: 987,
      lastUpdated: '1 week ago',
      type: 'article'
    },
    {
      id: '3',
      title: 'API Authentication Methods',
      excerpt: 'Comprehensive guide to API authentication including API keys, OAuth 2.0, and JWT tokens.',
      category: 'api',
      subcategory: 'Authentication',
      readTime: '12 min',
      views: 8920,
      helpful: 756,
      lastUpdated: '3 days ago',
      type: 'article'
    },
    {
      id: '4',
      title: 'Setting Up Single Sign-On (SSO)',
      excerpt: 'Configure SAML 2.0 SSO for your organization with this detailed walkthrough.',
      category: 'security',
      subcategory: 'SSO',
      readTime: '20 min',
      views: 5640,
      helpful: 432,
      lastUpdated: '1 week ago',
      type: 'tutorial'
    },
    {
      id: '5',
      title: 'Workflow Actions Reference',
      excerpt: 'Complete reference of all available workflow actions including click, type, wait, and more.',
      category: 'automation',
      subcategory: 'Actions',
      readTime: '25 min',
      views: 9870,
      helpful: 876,
      lastUpdated: '5 days ago',
      type: 'article'
    },
    {
      id: '6',
      title: 'Video: Getting Started with CUBE Elite',
      excerpt: 'Watch this comprehensive video tutorial to learn the basics of CUBE Elite.',
      category: 'getting-started',
      subcategory: 'First Steps',
      readTime: '18 min',
      views: 23450,
      helpful: 1876,
      lastUpdated: '2 weeks ago',
      type: 'video'
    },
    {
      id: '7',
      title: 'Managing Team Roles and Permissions',
      excerpt: 'Learn how to set up granular permissions for team members and manage access levels.',
      category: 'team',
      subcategory: 'Permissions',
      readTime: '10 min',
      views: 4230,
      helpful: 345,
      lastUpdated: '4 days ago',
      type: 'article'
    },
    {
      id: '8',
      title: 'Webhook Integration Guide',
      excerpt: 'Set up webhooks to integrate CUBE Elite with your existing tools and workflows.',
      category: 'api',
      subcategory: 'Webhooks',
      readTime: '14 min',
      views: 6780,
      helpful: 567,
      lastUpdated: '1 week ago',
      type: 'tutorial'
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'tutorial': return <Terminal size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  return (
    <div className="knowledge-base">
      <header className="knowledge-base__header">
        <div className="header-content">
          <button 
            className="menu-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu size={20} />
          </button>
          <div className="knowledge-base__icon">
            <BookOpen size={28} />
          </div>
          <div>
            <h1>Knowledge Base</h1>
            <p>Find answers, tutorials, and documentation</p>
          </div>
        </div>
        
        <div className="header-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search articles, guides, and documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="knowledge-base__layout">
        <aside className={`knowledge-base__sidebar ${showSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Categories</h3>
            <button 
              className="close-sidebar"
              onClick={() => setShowSidebar(false)}
            >
              <X size={18} />
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`nav-item home ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <Home size={18} />
              All Articles
            </button>
            
            {categories.map(category => (
              <div key={category.id} className="nav-category">
                <button 
                  className={`nav-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    toggleCategory(category.id);
                  }}
                >
                  <span className="nav-icon">{category.icon}</span>
                  <span className="nav-label">{category.name}</span>
                  <span className="nav-count">{category.articleCount}</span>
                  <ChevronDown 
                    size={16} 
                    className={`nav-arrow ${expandedCategories.includes(category.id) ? 'expanded' : ''}`}
                  />
                </button>
                
                {expandedCategories.includes(category.id) && (
                  <div className="nav-subcategories">
                    {category.subcategories.map(sub => (
                      <button key={sub} className="nav-subitem">
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="knowledge-base__content">
          {!selectedArticle ? (
            <>
              <div className="content-header">
                <nav className="breadcrumb">
                  <a href="/knowledge">Knowledge Base</a>
                  {selectedCategory && (
                    <>
                      <ChevronRight size={14} />
                      <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                    </>
                  )}
                </nav>
                
                <h2>
                  {selectedCategory 
                    ? categories.find(c => c.id === selectedCategory)?.name 
                    : 'All Articles'
                  }
                </h2>
                <p className="content-description">
                  {selectedCategory 
                    ? categories.find(c => c.id === selectedCategory)?.description
                    : 'Browse our complete knowledge base'
                  }
                </p>
              </div>

              {!selectedCategory && (
                <div className="categories-overview">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className="category-card"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="category-icon">{category.icon}</div>
                      <div className="category-content">
                        <h3>{category.name}</h3>
                        <p>{category.description}</p>
                        <span className="article-count">
                          {category.articleCount} articles
                        </span>
                      </div>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
              )}

              <div className="articles-section">
                <h3>
                  {selectedCategory ? 'Articles' : 'Popular Articles'}
                </h3>
                
                <div className="articles-list">
                  {filteredArticles.map(article => (
                    <article 
                      key={article.id} 
                      className="article-card"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="article-type">
                        {getTypeIcon(article.type)}
                        <span>{article.type}</span>
                      </div>
                      
                      <h4>{article.title}</h4>
                      <p>{article.excerpt}</p>
                      
                      <div className="article-meta">
                        <span className="meta-item">
                          <Clock size={14} />
                          {article.readTime}
                        </span>
                        <span className="meta-item">
                          <Eye size={14} />
                          {formatViews(article.views)}
                        </span>
                        <span className="meta-item">
                          <ThumbsUp size={14} />
                          {article.helpful}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="article-view">
              <nav className="article-nav">
                <button 
                  className="back-btn"
                  onClick={() => setSelectedArticle(null)}
                >
                  <ArrowLeft size={18} />
                  Back to Articles
                </button>
                
                <div className="article-actions">
                  <button className="action-btn" title="Bookmark">
                    <Bookmark size={18} />
                  </button>
                  <button className="action-btn" title="Share">
                    <Share2 size={18} />
                  </button>
                  <button className="action-btn" title="Print">
                    <Printer size={18} />
                  </button>
                </div>
              </nav>

              <div className="article-header">
                <nav className="breadcrumb">
                  <a href="/knowledge">Knowledge Base</a>
                  <ChevronRight size={14} />
                  <a href={`/knowledge/${selectedArticle.category}`}>
                    {categories.find(c => c.id === selectedArticle.category)?.name}
                  </a>
                  <ChevronRight size={14} />
                  <span>{selectedArticle.subcategory}</span>
                </nav>
                
                <div className="article-type-badge">
                  {getTypeIcon(selectedArticle.type)}
                  {selectedArticle.type}
                </div>
                
                <h1>{selectedArticle.title}</h1>
                
                <div className="article-info">
                  <span>
                    <Clock size={14} />
                    {selectedArticle.readTime} read
                  </span>
                  <span>
                    <Eye size={14} />
                    {formatViews(selectedArticle.views)} views
                  </span>
                  <span>Updated {selectedArticle.lastUpdated}</span>
                </div>
              </div>

              <div className="article-body">
                <p className="intro">{selectedArticle.excerpt}</p>
                
                <h2>Overview</h2>
                <p>
                  This guide will walk you through the complete process step by step. 
                  By the end of this article, you'll have a solid understanding of the concepts 
                  and be able to apply them to your own projects.
                </p>

                <h2>Prerequisites</h2>
                <ul>
                  <li>A CUBE Elite account (free or paid)</li>
                  <li>Basic understanding of web browsers</li>
                  <li>10-15 minutes of your time</li>
                </ul>

                <h2>Step 1: Getting Started</h2>
                <p>
                  First, navigate to your dashboard and locate the feature panel. 
                  You'll see several options available depending on your plan level.
                </p>

                <div className="code-block">
                  <div className="code-header">
                    <span>Example Configuration</span>
                    <button>Copy</button>
                  </div>
                  <pre>{`{
  "name": "My First Automation",
  "trigger": "manual",
  "steps": [
    { "action": "navigate", "url": "https://example.com" },
    { "action": "click", "selector": "#login-btn" }
  ]
}`}</pre>
                </div>

                <h2>Step 2: Configuration</h2>
                <p>
                  Configure the settings according to your needs. Make sure to test 
                  each step before moving on to the next one.
                </p>

                <div className="info-box">
                  <strong>💡 Pro Tip:</strong> Always use specific selectors for better reliability. 
                  IDs are more stable than class names.
                </div>

                <h2>Conclusion</h2>
                <p>
                  You've now learned the basics of this feature. For more advanced usage, 
                  check out our other guides in this category.
                </p>

                <div className="related-articles">
                  <h3>Related Articles</h3>
                  <div className="related-list">
                    {articles.slice(0, 3).map(article => (
                      <a key={article.id} href="#" className="related-item">
                        <FileText size={16} />
                        <span>{article.title}</span>
                        <ArrowRight size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="article-feedback">
                <p>Was this article helpful?</p>
                <div className="feedback-buttons">
                  <button className="feedback-btn yes">
                    <ThumbsUp size={18} />
                    Yes, it helped
                  </button>
                  <button className="feedback-btn no">
                    <ThumbsDown size={18} />
                    No, I need more help
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
