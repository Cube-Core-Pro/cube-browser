'use client';

import React, { useState } from 'react';
import {
  Download,
  Package,
  Code,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Github,
  BookOpen,
  Coffee,
  Zap,
  Star,
  FileCode,
  Server,
  Globe,
  Smartphone,
  Cpu,
  ChevronRight,
  Search,
  Filter,
  Shield,
  Clock,
  Tag,
  Box
} from 'lucide-react';
import './sdk.css';

interface SDK {
  id: string;
  name: string;
  language: string;
  version: string;
  description: string;
  icon: string;
  installCommand: string;
  packageManager: string;
  githubUrl: string;
  docsUrl: string;
  downloads: number;
  stars: number;
  lastUpdated: string;
  platforms: string[];
  features: string[];
  license: string;
  size: string;
  minVersion?: string;
}

interface CodeSnippet {
  language: string;
  code: string;
}

const sdks: SDK[] = [
  {
    id: 'js',
    name: 'JavaScript SDK',
    language: 'javascript',
    version: '3.2.1',
    description: 'Official JavaScript SDK for browser and Node.js environments. Full TypeScript support included.',
    icon: 'js',
    installCommand: 'npm install @cube/sdk',
    packageManager: 'npm',
    githubUrl: 'https://github.com/cube-sdk/cube-js',
    docsUrl: 'https://docs.cube.io/sdk/javascript',
    downloads: 125000,
    stars: 2847,
    lastUpdated: '2 days ago',
    platforms: ['Browser', 'Node.js', 'Deno', 'Bun'],
    features: ['TypeScript Support', 'Tree Shaking', 'ES Modules', 'Async/Await', 'WebSocket'],
    license: 'MIT',
    size: '45 KB',
    minVersion: 'Node 18+'
  },
  {
    id: 'python',
    name: 'Python SDK',
    language: 'python',
    version: '2.8.0',
    description: 'Pythonic SDK with async support, type hints, and comprehensive documentation.',
    icon: 'python',
    installCommand: 'pip install cube-sdk',
    packageManager: 'pip',
    githubUrl: 'https://github.com/cube-sdk/cube-python',
    docsUrl: 'https://docs.cube.io/sdk/python',
    downloads: 89000,
    stars: 1923,
    lastUpdated: '5 days ago',
    platforms: ['Python 3.8+'],
    features: ['Type Hints', 'Async Support', 'Dataclasses', 'Pydantic Models', 'Retry Logic'],
    license: 'MIT',
    size: '32 KB',
    minVersion: 'Python 3.8+'
  },
  {
    id: 'go',
    name: 'Go SDK',
    language: 'go',
    version: '1.5.2',
    description: 'High-performance Go SDK with idiomatic error handling and context support.',
    icon: 'go',
    installCommand: 'go get github.com/cube-sdk/cube-go',
    packageManager: 'go modules',
    githubUrl: 'https://github.com/cube-sdk/cube-go',
    docsUrl: 'https://docs.cube.io/sdk/go',
    downloads: 45000,
    stars: 892,
    lastUpdated: '1 week ago',
    platforms: ['Go 1.20+'],
    features: ['Context Support', 'Generics', 'Error Wrapping', 'Connection Pooling', 'Zero Alloc'],
    license: 'MIT',
    size: '18 KB',
    minVersion: 'Go 1.20+'
  },
  {
    id: 'rust',
    name: 'Rust SDK',
    language: 'rust',
    version: '0.9.4',
    description: 'Memory-safe Rust SDK with async runtime support and zero-copy deserialization.',
    icon: 'rust',
    installCommand: 'cargo add cube-sdk',
    packageManager: 'cargo',
    githubUrl: 'https://github.com/cube-sdk/cube-rust',
    docsUrl: 'https://docs.cube.io/sdk/rust',
    downloads: 28000,
    stars: 756,
    lastUpdated: '3 days ago',
    platforms: ['Rust 1.70+'],
    features: ['Async/Await', 'Zero-Copy', 'WASM Support', 'Serde Integration', 'Tokio Runtime'],
    license: 'MIT/Apache-2.0',
    size: '24 KB',
    minVersion: 'Rust 1.70+'
  },
  {
    id: 'java',
    name: 'Java SDK',
    language: 'java',
    version: '4.1.0',
    description: 'Enterprise-grade Java SDK with Spring Boot integration and reactive support.',
    icon: 'java',
    installCommand: 'implementation "io.cube:cube-sdk:4.1.0"',
    packageManager: 'gradle/maven',
    githubUrl: 'https://github.com/cube-sdk/cube-java',
    docsUrl: 'https://docs.cube.io/sdk/java',
    downloads: 67000,
    stars: 1245,
    lastUpdated: '1 week ago',
    platforms: ['Java 17+', 'Kotlin'],
    features: ['Spring Boot', 'Reactive Streams', 'Virtual Threads', 'Builder Pattern', 'Lombok'],
    license: 'Apache-2.0',
    size: '156 KB',
    minVersion: 'Java 17+'
  },
  {
    id: 'csharp',
    name: 'C# SDK',
    language: 'csharp',
    version: '2.4.1',
    description: '.NET SDK with full async support, dependency injection, and Entity Framework integration.',
    icon: 'csharp',
    installCommand: 'dotnet add package Cube.SDK',
    packageManager: 'nuget',
    githubUrl: 'https://github.com/cube-sdk/cube-dotnet',
    docsUrl: 'https://docs.cube.io/sdk/csharp',
    downloads: 52000,
    stars: 987,
    lastUpdated: '4 days ago',
    platforms: ['.NET 6+', '.NET 8'],
    features: ['Dependency Injection', 'Source Generators', 'Nullable References', 'Records', 'LINQ'],
    license: 'MIT',
    size: '89 KB',
    minVersion: '.NET 6+'
  },
  {
    id: 'php',
    name: 'PHP SDK',
    language: 'php',
    version: '3.0.2',
    description: 'Modern PHP SDK with PSR compliance, Laravel integration, and async support.',
    icon: 'php',
    installCommand: 'composer require cube/sdk',
    packageManager: 'composer',
    githubUrl: 'https://github.com/cube-sdk/cube-php',
    docsUrl: 'https://docs.cube.io/sdk/php',
    downloads: 38000,
    stars: 654,
    lastUpdated: '1 week ago',
    platforms: ['PHP 8.1+'],
    features: ['PSR-7/18', 'Laravel', 'Symfony', 'Attributes', 'Fibers'],
    license: 'MIT',
    size: '42 KB',
    minVersion: 'PHP 8.1+'
  },
  {
    id: 'ruby',
    name: 'Ruby SDK',
    language: 'ruby',
    version: '2.1.0',
    description: 'Elegant Ruby SDK with Rails integration and convention-over-configuration approach.',
    icon: 'ruby',
    installCommand: 'gem install cube-sdk',
    packageManager: 'rubygems',
    githubUrl: 'https://github.com/cube-sdk/cube-ruby',
    docsUrl: 'https://docs.cube.io/sdk/ruby',
    downloads: 21000,
    stars: 445,
    lastUpdated: '2 weeks ago',
    platforms: ['Ruby 3.0+'],
    features: ['Rails Integration', 'ActiveRecord', 'Sidekiq Jobs', 'Faraday HTTP', 'RSpec Tests'],
    license: 'MIT',
    size: '28 KB',
    minVersion: 'Ruby 3.0+'
  }
];

const quickStartSnippets: Record<string, CodeSnippet[]> = {
  js: [
    { language: 'bash', code: 'npm install @cube/sdk' },
    { language: 'javascript', code: `import { CubeClient } from '@cube/sdk';

const client = new CubeClient({
  apiKey: process.env.CUBE_API_KEY,
  environment: 'production'
});

// Fetch data
const data = await client.data.list();
console.log(data);` }
  ],
  python: [
    { language: 'bash', code: 'pip install cube-sdk' },
    { language: 'python', code: `from cube_sdk import CubeClient

client = CubeClient(
    api_key=os.environ["CUBE_API_KEY"],
    environment="production"
)

# Fetch data
data = await client.data.list()
print(data)` }
  ],
  go: [
    { language: 'bash', code: 'go get github.com/cube-sdk/cube-go' },
    { language: 'go', code: `package main

import (
    "github.com/cube-sdk/cube-go"
)

func main() {
    client := cube.NewClient(
        cube.WithAPIKey(os.Getenv("CUBE_API_KEY")),
    )

    data, err := client.Data.List(ctx)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(data)
}` }
  ],
  rust: [
    { language: 'bash', code: 'cargo add cube-sdk' },
    { language: 'rust', code: `use cube_sdk::CubeClient;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let client = CubeClient::builder()
        .api_key(env::var("CUBE_API_KEY")?)
        .build()?;

    let data = client.data().list().await?;
    println!("{:?}", data);
    Ok(())
}` }
  ]
};

export default function SDKDownloadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSDK, setSelectedSDK] = useState<SDK | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  const languages = ['all', 'javascript', 'python', 'go', 'rust', 'java', 'csharp', 'php', 'ruby'];

  const filteredSDKs = sdks.filter(sdk => {
    const matchesSearch = sdk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sdk.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || sdk.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  const copyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      python: '🐍',
      go: '🔵',
      rust: '🦀',
      java: '☕',
      csharp: '💜',
      php: '🐘',
      ruby: '💎'
    };
    return icons[language] || '📦';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="sdk-downloads">
      {/* Header */}
      <div className="sdk-downloads__header">
        <div className="sdk-downloads__title-section">
          <div className="sdk-downloads__icon">
            <Package size={28} />
          </div>
          <div>
            <h1>SDK Downloads</h1>
            <p>Official SDKs and client libraries for all major platforms</p>
          </div>
        </div>
        <div className="header-actions">
          <a href="https://docs.cube.io/sdk" className="btn-outline" target="_blank" rel="noopener noreferrer">
            <BookOpen size={18} />
            Documentation
          </a>
          <a href="https://github.com/cube-sdk" className="btn-outline" target="_blank" rel="noopener noreferrer">
            <Github size={18} />
            GitHub
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="sdk-downloads__stats">
        <div className="stat-card">
          <div className="stat-icon downloads">
            <Download size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(sdks.reduce((sum, s) => sum + s.downloads, 0))}</span>
            <span className="stat-label">Total Downloads</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon languages">
            <Code size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{sdks.length}</span>
            <span className="stat-label">Languages</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stars">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(sdks.reduce((sum, s) => sum + s.stars, 0))}</span>
            <span className="stat-label">GitHub Stars</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon platforms">
            <Globe size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{new Set(sdks.flatMap(s => s.platforms)).size}</span>
            <span className="stat-label">Platforms</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sdk-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search SDKs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="language-filters">
            {languages.map(lang => (
              <button
                key={lang}
                className={`filter-btn ${languageFilter === lang ? 'active' : ''}`}
                onClick={() => setLanguageFilter(lang)}
              >
                {lang === 'all' ? 'All' : (
                  <>
                    <span className="lang-icon">{getLanguageIcon(lang)}</span>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SDK Grid */}
      <div className="sdk-grid">
        {filteredSDKs.map(sdk => (
          <div key={sdk.id} className="sdk-card">
            <div className="sdk-header">
              <div className="sdk-icon">
                <span>{getLanguageIcon(sdk.language)}</span>
              </div>
              <div className="sdk-meta">
                <div className="sdk-badges">
                  <span className="version-badge">v{sdk.version}</span>
                  <span className="license-badge">{sdk.license}</span>
                </div>
              </div>
            </div>

            <div className="sdk-info">
              <h3>{sdk.name}</h3>
              <p>{sdk.description}</p>
            </div>

            <div className="install-command">
              <code>{sdk.installCommand}</code>
              <button 
                className="copy-btn"
                onClick={() => copyCommand(sdk.installCommand, sdk.id)}
                title="Copy command"
              >
                {copiedCommand === sdk.id ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="sdk-stats">
              <div className="stat">
                <Download size={14} />
                <span>{formatNumber(sdk.downloads)}</span>
              </div>
              <div className="stat">
                <Star size={14} />
                <span>{formatNumber(sdk.stars)}</span>
              </div>
              <div className="stat">
                <Clock size={14} />
                <span>{sdk.lastUpdated}</span>
              </div>
            </div>

            <div className="sdk-platforms">
              {sdk.platforms.slice(0, 3).map((platform, idx) => (
                <span key={idx} className="platform-tag">{platform}</span>
              ))}
              {sdk.platforms.length > 3 && (
                <span className="platform-more">+{sdk.platforms.length - 3}</span>
              )}
            </div>

            <div className="sdk-features">
              {sdk.features.slice(0, 3).map((feature, idx) => (
                <span key={idx} className="feature-tag">{feature}</span>
              ))}
            </div>

            <div className="sdk-actions">
              <button className="btn-primary" onClick={() => setSelectedSDK(sdk)}>
                <Zap size={16} />
                Quick Start
              </button>
              <a href={sdk.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Github size={16} />
                GitHub
              </a>
              <a href={sdk.docsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <BookOpen size={16} />
                Docs
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredSDKs.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No SDKs found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Additional Resources */}
      <div className="additional-resources">
        <h2>Additional Resources</h2>
        <div className="resources-grid">
          <a href="https://docs.cube.io/api" className="resource-card" target="_blank" rel="noopener noreferrer">
            <div className="resource-icon api">
              <Server size={24} />
            </div>
            <div className="resource-info">
              <h3>REST API Reference</h3>
              <p>Complete API documentation with examples</p>
            </div>
            <ChevronRight size={20} />
          </a>
          <a href="https://docs.cube.io/webhooks" className="resource-card" target="_blank" rel="noopener noreferrer">
            <div className="resource-icon webhooks">
              <Zap size={24} />
            </div>
            <div className="resource-info">
              <h3>Webhooks Guide</h3>
              <p>Real-time event notifications setup</p>
            </div>
            <ChevronRight size={20} />
          </a>
          <a href="https://docs.cube.io/cli" className="resource-card" target="_blank" rel="noopener noreferrer">
            <div className="resource-icon cli">
              <Terminal size={24} />
            </div>
            <div className="resource-info">
              <h3>CLI Tool</h3>
              <p>Command-line interface for developers</p>
            </div>
            <ChevronRight size={20} />
          </a>
          <a href="https://docs.cube.io/mobile" className="resource-card" target="_blank" rel="noopener noreferrer">
            <div className="resource-icon mobile">
              <Smartphone size={24} />
            </div>
            <div className="resource-info">
              <h3>Mobile SDKs</h3>
              <p>iOS and Android native SDKs</p>
            </div>
            <ChevronRight size={20} />
          </a>
        </div>
      </div>

      {/* Quick Start Modal */}
      {selectedSDK && (
        <div className="modal-overlay" onClick={() => setSelectedSDK(null)}>
          <div className="modal quickstart-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="sdk-icon-large">{getLanguageIcon(selectedSDK.language)}</span>
                <div>
                  <h2>{selectedSDK.name}</h2>
                  <span className="version">v{selectedSDK.version}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedSDK(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="sdk-description">{selectedSDK.description}</p>

              <div className="quickstart-section">
                <h3>Installation</h3>
                <div className="code-block">
                  <div className="code-header">
                    <span>{selectedSDK.packageManager}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyCommand(selectedSDK.installCommand, 'modal-install')}
                    >
                      {copiedCommand === 'modal-install' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre><code>{selectedSDK.installCommand}</code></pre>
                </div>
              </div>

              {quickStartSnippets[selectedSDK.id] && (
                <div className="quickstart-section">
                  <h3>Quick Start</h3>
                  {quickStartSnippets[selectedSDK.id].map((snippet, idx) => (
                    <div key={idx} className="code-block">
                      <div className="code-header">
                        <span>{snippet.language}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyCommand(snippet.code, `modal-snippet-${idx}`)}
                        >
                          {copiedCommand === `modal-snippet-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <pre><code>{snippet.code}</code></pre>
                    </div>
                  ))}
                </div>
              )}

              <div className="quickstart-section">
                <h3>Features</h3>
                <div className="features-grid">
                  {selectedSDK.features.map((feature, idx) => (
                    <span key={idx} className="feature-item">
                      <Check size={14} />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="quickstart-section">
                <h3>Requirements</h3>
                <div className="requirements-list">
                  <div className="requirement">
                    <Cpu size={16} />
                    <span>{selectedSDK.minVersion}</span>
                  </div>
                  <div className="requirement">
                    <Box size={16} />
                    <span>Package size: {selectedSDK.size}</span>
                  </div>
                  <div className="requirement">
                    <Shield size={16} />
                    <span>License: {selectedSDK.license}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a href={selectedSDK.docsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <BookOpen size={16} />
                Full Documentation
              </a>
              <a href={selectedSDK.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Github size={16} />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
