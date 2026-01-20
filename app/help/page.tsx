"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle, Book, MessageCircle, Video, FileText, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useTranslation } from '@/hooks/useTranslation';

export default function HelpPage() {
  const { t: _t } = useTranslation();
  const router = useRouter();

  return (
    <AppLayout tier="elite">
      <div className="p-6 space-y-6">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Help Center</h1>
                <p className="text-sm text-muted-foreground">Documentation & Support</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 mb-4">
                <HelpCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">How can we help you?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Find answers, tutorials, and get support for CUBE Nexum
              </p>
            </div>
          </div>

          {/* Quick Links Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Documentation */}
            <a href="https://docs.cubeai.tools" target="_blank" rel="noopener noreferrer" className="bg-card/50 border border-border rounded-xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer block">
              <div className="p-3 rounded-lg bg-blue-500/20 w-fit mb-4">
                <Book className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Comprehensive guides and API references
              </p>
              <div className="text-emerald-400 text-sm font-medium">View Docs →</div>
            </a>

            {/* Video Tutorials */}
            <a href="https://youtube.com/@cubeai" target="_blank" rel="noopener noreferrer" className="bg-card/50 border border-border rounded-xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer block">
              <div className="p-3 rounded-lg bg-purple-500/20 w-fit mb-4">
                <Video className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Step-by-step video guides for all features
              </p>
              <div className="text-emerald-400 text-sm font-medium">Watch Now →</div>
            </a>

            {/* Community */}
            <a href="https://discord.gg/cubeai" target="_blank" rel="noopener noreferrer" className="bg-card/50 border border-border rounded-xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer block">
              <div className="p-3 rounded-lg bg-orange-500/20 w-fit mb-4">
                <MessageCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Connect with other users and experts
              </p>
              <div className="text-emerald-400 text-sm font-medium">Join Discord →</div>
            </a>
          </div>

          {/* Popular Topics */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6">Popular Topics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium">Getting Started</div>
                    <div className="text-sm text-muted-foreground">Learn the basics of CUBE Nexum</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium">Workflow Automation</div>
                    <div className="text-sm text-muted-foreground">Build your first workflow</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-medium">Browser Automation</div>
                    <div className="text-sm text-muted-foreground">Automate web tasks</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="font-medium">AI Features</div>
                    <div className="text-sm text-muted-foreground">Leverage AI capabilities</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-pink-400" />
                  <div>
                    <div className="font-medium">Data Extraction</div>
                    <div className="text-sm text-muted-foreground">Extract and process data</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="font-medium">Troubleshooting</div>
                    <div className="text-sm text-muted-foreground">Common issues and solutions</div>
                  </div>
                </div>
              </div>

              <div className="bg-card/30 border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-medium">Password Manager</div>
                    <div className="text-sm text-muted-foreground">Vault, autofill, TOTP & passkeys</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Manager Features Section */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6">🔐 Password Manager Premium Features</h3>
            <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-6">
              <p className="text-muted-foreground mb-6">
                CUBE Nexum includes a world-class password manager with features that rival Bitwarden, 1Password, and Dashlane.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-sm">Inline Autofill Menu</div>
                  <div className="text-xs text-muted-foreground">Focus any field, see matching credentials instantly</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">⌨️</div>
                  <div className="font-medium text-sm">Keyboard Shortcuts</div>
                  <div className="text-xs text-muted-foreground">Ctrl+Shift+L to autofill, fully customizable</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🔢</div>
                  <div className="font-medium text-sm">TOTP Authenticator</div>
                  <div className="text-xs text-muted-foreground">Built-in 2FA codes, no separate app needed</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🔐</div>
                  <div className="font-medium text-sm">Passkeys/WebAuthn</div>
                  <div className="text-xs text-muted-foreground">Passwordless login with biometrics</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🛡️</div>
                  <div className="font-medium text-sm">Phishing Protection</div>
                  <div className="text-xs text-muted-foreground">Real-time detection of fake sites</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🗼</div>
                  <div className="font-medium text-sm">Security Watchtower</div>
                  <div className="text-xs text-muted-foreground">Breach monitoring, password health</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium text-sm">Drag & Drop Fill</div>
                  <div className="text-xs text-muted-foreground">Drag credentials to any form field</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium text-sm">Page Load Autofill</div>
                  <div className="text-xs text-muted-foreground">Auto-fill forms as pages load</div>
                </div>
                <div className="bg-card/30 rounded-lg p-4 border border-border">
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-medium text-sm">Enterprise SSO</div>
                  <div className="text-xs text-muted-foreground">Azure AD, Okta, Google Workspace</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-card/50 rounded-lg border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="font-medium text-emerald-400">AI Assistant Integration</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Try saying: &quot;Fill my login&quot;, &quot;Run a security scan&quot;, &quot;What&apos;s my 2FA code for Google?&quot;, or &quot;Check if this site is safe&quot;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-card/50 to-card/30 border border-border rounded-xl p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 mb-4">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
              <p className="text-muted-foreground mb-6">
                Our support team is here to help you with any questions or issues
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                  Contact Support
                </button>
                <button className="px-6 py-3 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors">
                  Schedule a Demo
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center py-8 mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-medium">Documentation system in development</span>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AppLayout>
  );
}
