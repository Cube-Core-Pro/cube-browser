"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores';
import { useTheme } from '@/components/providers/theme-provider';
import { aiService } from '@/lib/services/ai-service';
import { AccountSettings, UpdateSettings, EmailSettings } from '@/components/settings';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Settings, Key, Globe, Zap, Database, Check, X, Eye, EyeOff, Sun, Moon, User, Download, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, setTheme: setStoreTheme, setApiKey, removeApiKey, updatePreferences, updateBrowserSettings, updateAutomationSettings, updateDataSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys.openai || '');
  const [anthropicKey, setAnthropicKey] = useState(settings.apiKeys.anthropic || '');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpenaiKey(settings.apiKeys.openai || '');
    setAnthropicKey(settings.apiKeys.anthropic || '');
  }, [settings.apiKeys]);

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      if (openaiKey) {
        setApiKey('openai', openaiKey);
        await aiService.setApiKey(openaiKey);
      } else {
        removeApiKey('openai');
      }
      
      if (anthropicKey) {
        setApiKey('anthropic', anthropicKey);
      } else {
        removeApiKey('anthropic');
      }
      
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      log.error('Failed to save API keys:', error);
      setSaving(false);
    }
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey) return;
    
    setTestingOpenai(true);
    setOpenaiStatus('idle');
    
    try {
      await aiService.setApiKey(openaiKey);
      const hasKey = await aiService.hasApiKey();
      
      if (hasKey) {
        const response = await aiService.sendRequest(
          'Say "API key works!" in exactly 3 words.',
          'gpt-4o-mini',
          0.1,
          10
        );
        
        if (response.content) {
          setOpenaiStatus('success');
        } else {
          setOpenaiStatus('error');
        }
      } else {
        setOpenaiStatus('error');
      }
    } catch (error) {
      log.error('OpenAI test failed:', error);
      setOpenaiStatus('error');
    } finally {
      setTestingOpenai(false);
    }
  };

  return (
    <AppLayout tier={settings.tier}>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
            <TabsTrigger value="account">{t('settings.tabs.account')}</TabsTrigger>
            <TabsTrigger value="updates">{t('settings.tabs.updates')}</TabsTrigger>
            <TabsTrigger value="api-keys">{t('settings.tabs.apiKeys')}</TabsTrigger>
            <TabsTrigger value="email">{t('settings.tabs.email')}</TabsTrigger>
            <TabsTrigger value="browser">{t('settings.tabs.browser')}</TabsTrigger>
            <TabsTrigger value="automation">{t('settings.tabs.automation')}</TabsTrigger>
            <TabsTrigger value="data">{t('settings.tabs.data')}</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system' | 'elite-purple' | 'midnight') => {
                    setTheme(value);
                    setStoreTheme(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="elite-purple">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          Elite Purple
                        </div>
                      </SelectItem>
                      <SelectItem value="midnight">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-blue-500" />
                          Midnight Blue
                        </div>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Tier</label>
                  <div>
                    <Badge variant="secondary" className="bg-purple-600 text-white">
                      {settings.tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </CardTitle>
                <CardDescription>
                  {t('settings.languageDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSelector variant="list" showFlag={true} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>General application preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'autoSave', label: 'Auto-save workflows', description: 'Automatically save workflow changes' },
                  { key: 'autoBackup', label: 'Auto-backup data', description: 'Automatically backup your data' },
                  { key: 'notificationsEnabled', label: 'Enable notifications', description: 'Show desktop notifications' },
                  { key: 'checkForUpdates', label: 'Check for updates', description: 'Automatically check for new versions' },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{pref.label}</label>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                    <Button
                      variant={settings.preferences[pref.key as keyof typeof settings.preferences] ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePreferences({ [pref.key]: !settings.preferences[pref.key as keyof typeof settings.preferences] })}
                    >
                      {settings.preferences[pref.key as keyof typeof settings.preferences] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Account Settings</CardTitle>
                </div>
                <CardDescription>
                  Manage your profile, billing address, and communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Updates & Sync Tab */}
          <TabsContent value="updates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <CardTitle>Updates & Cloud Sync</CardTitle>
                </div>
                <CardDescription>
                  Manage application updates, cloud synchronization, and connected devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpdateSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <CardTitle>OpenAI API Key</CardTitle>
                </div>
                <CardDescription>
                  Required for AI-powered features like selector generation and workflow creation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showOpenaiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-proj-..."
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={handleTestOpenAI}
                      disabled={!openaiKey || testingOpenai}
                      variant="outline"
                    >
                      {testingOpenai ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  {openaiStatus === 'success' && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      API key is valid and working!
                    </p>
                  )}
                  {openaiStatus === 'error' && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <X className="h-4 w-4" />
                      API key test failed. Please check your key.
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      OpenAI Platform
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <CardTitle>Anthropic API Key</CardTitle>
                </div>
                <CardDescription>
                  Optional: For Claude AI integration and advanced analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showAnthropicKey ? "text" : "password"}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      >
                        {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Used for Claude-powered analysis and document processing</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveApiKeys} disabled={saving}>
                {saving ? 'Saving...' : 'Save API Keys'}
              </Button>
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <EmailSettings />
          </TabsContent>

          {/* Browser Tab */}
          <TabsContent value="browser" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>Browser Settings</CardTitle>
                </div>
                <CardDescription>Configure browser behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'enableJavaScript', label: 'Enable JavaScript', description: 'Allow JavaScript execution' },
                  { key: 'enableImages', label: 'Enable Images', description: 'Load images from web pages' },
                  { key: 'enableCookies', label: 'Enable Cookies', description: 'Store and use cookies' },
                  { key: 'clearCacheOnExit', label: 'Clear cache on exit', description: 'Delete cache when closing the app' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{setting.label}</label>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Button
                      variant={settings.browser[setting.key as keyof typeof settings.browser] ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateBrowserSettings({ [setting.key]: !settings.browser[setting.key as keyof typeof settings.browser] })}
                    >
                      {settings.browser[setting.key as keyof typeof settings.browser] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <CardTitle>Automation Settings</CardTitle>
                </div>
                <CardDescription>Configure automation behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Timeout (ms)</label>
                  <Input
                    type="number"
                    value={settings.automation.defaultTimeout}
                    onChange={(e) => updateAutomationSettings({ defaultTimeout: parseInt(e.target.value) || 30000 })}
                    min={1000}
                    step={1000}
                  />
                  <p className="text-xs text-muted-foreground">Maximum time to wait for elements</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Retry Attempts</label>
                  <Input
                    type="number"
                    value={settings.automation.retryAttempts}
                    onChange={(e) => updateAutomationSettings({ retryAttempts: parseInt(e.target.value) || 3 })}
                    min={0}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">Number of retry attempts on failure</p>
                </div>

                <Separator />

                {[
                  { key: 'captureScreenshots', label: 'Capture screenshots', description: 'Take screenshots during automation' },
                  { key: 'verboseLogging', label: 'Verbose logging', description: 'Enable detailed execution logs' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{setting.label}</label>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Button
                      variant={settings.automation[setting.key as keyof typeof settings.automation] ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAutomationSettings({ [setting.key]: !settings.automation[setting.key as keyof typeof settings.automation] })}
                    >
                      {settings.automation[setting.key as keyof typeof settings.automation] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>Data Management</CardTitle>
                </div>
                <CardDescription>Configure data storage and export settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Export Format</label>
                  <Select
                    value={settings.data.defaultExportFormat}
                    onValueChange={(value: 'json' | 'csv' | 'xlsx') => updateDataSettings({ defaultExportFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Retention (days)</label>
                  <Input
                    type="number"
                    value={settings.data.retentionDays}
                    onChange={(e) => updateDataSettings({ retentionDays: parseInt(e.target.value) || 30 })}
                    min={1}
                    max={365}
                  />
                  <p className="text-xs text-muted-foreground">How long to keep extracted data</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Auto-cleanup old data</label>
                    <p className="text-xs text-muted-foreground">Automatically delete data older than retention period</p>
                  </div>
                  <Button
                    variant={settings.data.autoCleanup ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateDataSettings({ autoCleanup: !settings.data.autoCleanup })}
                  >
                    {settings.data.autoCleanup ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
