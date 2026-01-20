'use client';

/**
 * CUBE Nexum - Public Downloads Page
 * 
 * NO REGISTRATION REQUIRED - Direct download access
 * This page allows anyone to download CUBE Nexum desktop application
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Download, Monitor, Apple, Terminal, Shield, Zap, 
  CheckCircle, Star, ArrowRight, Globe, Lock, Cpu,
  HardDrive, Gauge, Package
} from 'lucide-react';
import { SiteHeader } from '@/components/shared/SiteHeader';

interface DownloadOption {
  id: string;
  platform: string;
  icon: React.ReactNode;
  name: string;
  arch: string;
  size: string;
  version: string;
  url: string;
  checksum: string;
  recommended?: boolean;
}

const CURRENT_VERSION = '7.0.0';
const RELEASE_DATE = 'January 2026';

const downloadOptions: DownloadOption[] = [
  {
    id: 'windows-x64',
    platform: 'windows',
    icon: <Monitor className="w-8 h-8" />,
    name: 'Windows',
    arch: 'x64 (64-bit)',
    size: '89 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-windows-x64.msi',
    checksum: 'sha256:a1b2c3d4e5f6...',
    recommended: true,
  },
  {
    id: 'windows-arm64',
    platform: 'windows',
    icon: <Monitor className="w-8 h-8" />,
    name: 'Windows',
    arch: 'ARM64',
    size: '85 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-windows-arm64.msi',
    checksum: 'sha256:b2c3d4e5f6a1...',
  },
  {
    id: 'macos-universal',
    platform: 'macos',
    icon: <Apple className="w-8 h-8" />,
    name: 'macOS',
    arch: 'Universal (Intel + Apple Silicon)',
    size: '112 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-macos-universal.dmg',
    checksum: 'sha256:c3d4e5f6a1b2...',
    recommended: true,
  },
  {
    id: 'macos-intel',
    platform: 'macos',
    icon: <Apple className="w-8 h-8" />,
    name: 'macOS',
    arch: 'Intel (x64)',
    size: '95 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-macos-x64.dmg',
    checksum: 'sha256:d4e5f6a1b2c3...',
  },
  {
    id: 'linux-deb',
    platform: 'linux',
    icon: <Terminal className="w-8 h-8" />,
    name: 'Linux',
    arch: 'Debian/Ubuntu (.deb)',
    size: '78 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-linux-amd64.deb',
    checksum: 'sha256:e5f6a1b2c3d4...',
    recommended: true,
  },
  {
    id: 'linux-rpm',
    platform: 'linux',
    icon: <Terminal className="w-8 h-8" />,
    name: 'Linux',
    arch: 'Fedora/RHEL (.rpm)',
    size: '79 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-linux-x86_64.rpm',
    checksum: 'sha256:f6a1b2c3d4e5...',
  },
  {
    id: 'linux-appimage',
    platform: 'linux',
    icon: <Terminal className="w-8 h-8" />,
    name: 'Linux',
    arch: 'AppImage (Universal)',
    size: '92 MB',
    version: CURRENT_VERSION,
    url: '/releases/cube-nexum-7.0.0-linux-x86_64.AppImage',
    checksum: 'sha256:a1b2c3d4e5f6...',
  },
];

const features = [
  { icon: <Zap className="w-5 h-5" />, title: 'Lightning Fast', desc: 'Built with Rust for native performance' },
  { icon: <Shield className="w-5 h-5" />, title: 'Privacy First', desc: 'Your data stays on your device' },
  { icon: <Cpu className="w-5 h-5" />, title: 'AI Powered', desc: 'GPT-5 integration for smart automation' },
  { icon: <Globe className="w-5 h-5" />, title: 'Multi-Profile', desc: 'Isolated browser environments' },
];

const requirements = {
  windows: { os: 'Windows 10/11', ram: '4 GB RAM', disk: '500 MB', cpu: 'x64 or ARM64' },
  macos: { os: 'macOS 11+', ram: '4 GB RAM', disk: '500 MB', cpu: 'Intel or Apple Silicon' },
  linux: { os: 'Ubuntu 20.04+', ram: '4 GB RAM', disk: '500 MB', cpu: 'x64' },
};

export default function PublicDownloadsPage(): React.ReactElement {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'windows' | 'macos' | 'linux'>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  const filteredDownloads = selectedPlatform === 'all' 
    ? downloadOptions 
    : downloadOptions.filter(d => d.platform === selectedPlatform);

  const handleDownload = (option: DownloadOption) => {
    setDownloading(option.id);
    
    // Track download analytics (anonymous)
    fetch('/api/analytics/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: option.platform,
        arch: option.arch,
        version: option.version,
      }),
    }).catch(() => {});

    // Start download
    const link = document.createElement('a');
    link.href = option.url;
    link.download = option.url.split('/').pop() || 'cube-nexum';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <SiteHeader variant="dark" ctaText="Sign Up Free" ctaHref="/signup" />
      
      {/* Hero */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <CheckCircle className="w-4 h-4" />
            No registration required - Download instantly
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">CUBE Nexum</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-2">
            The most powerful browser automation platform
          </p>
          
          <p className="text-gray-500 mb-8">
            Version {CURRENT_VERSION} • Released {RELEASE_DATE}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-purple-400">{f.icon}</span>
                <span className="text-white text-sm font-medium">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Filter */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mx-auto">
            {(['all', 'windows', 'macos', 'linux'] as const).map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatform === platform
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Download Cards */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {filteredDownloads.map(option => (
              <div
                key={option.id}
                className={`relative p-6 rounded-2xl border transition-all ${
                  option.recommended
                    ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {option.recommended && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> Recommended
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      option.platform === 'windows' ? 'bg-blue-500/20 text-blue-400' :
                      option.platform === 'macos' ? 'bg-gray-500/20 text-gray-300' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{option.name}</h3>
                      <p className="text-gray-400 text-sm">{option.arch}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-medium">{option.size}</p>
                      <p className="text-gray-500 text-sm">v{option.version}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(option)}
                      disabled={downloading === option.id}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        downloading === option.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      }`}
                    >
                      {downloading === option.id ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">System Requirements</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(requirements).map(([platform, reqs]) => (
              <div key={platform} className="p-6 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-semibold mb-4 capitalize">{platform}</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    {reqs.os}
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    {reqs.ram}
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Package className="w-4 h-4 text-gray-500" />
                    {reqs.disk}
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Cpu className="w-4 h-4 text-gray-500" />
                    {reqs.cpu}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Need a License?</h3>
            <p className="text-gray-300 mb-6">
              CUBE Nexum is free to download. Upgrade to Pro or Elite for advanced features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            <Lock className="w-4 h-4 inline mr-1" />
            All downloads are signed and verified. Your privacy is protected.
          </p>
        </div>
      </section>
    </div>
  );
}
