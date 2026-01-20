'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('EmailSettings');

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  TestTube
} from 'lucide-react';
import './EmailSettings.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EmailService, 
  EmailConfig, 
  EmailProvider, 
  EmailTestResult, 
  EmailServiceStatus,
  EmailSendResult 
} from '@/lib/services/email-service';

interface EmailSettingsProps {
  onConfigChange?: (config: EmailConfig) => void;
}

export const EmailSettings: React.FC<EmailSettingsProps> = ({ onConfigChange }) => {
  // Config state
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [status, setStatus] = useState<EmailServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpEncryption, setSmtpEncryption] = useState<'tls' | 'starttls' | 'none'>('starttls');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpReplyTo, setSmtpReplyTo] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // SendGrid form state
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  const [sendgridFromEmail, setSendgridFromEmail] = useState('');
  const [sendgridFromName, setSendgridFromName] = useState('');
  const [sendgridReplyTo, setSendgridReplyTo] = useState('');
  const [sendgridTrackingEnabled, setSendgridTrackingEnabled] = useState(true);
  const [sendgridSandboxMode, setSendgridSandboxMode] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);

  // Rate limits
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(1000);

  // Testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<EmailTestResult | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<EmailSendResult | null>(null);

  // Load config on mount
  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const cfg = await EmailService.Config.getConfig();
      setConfig(cfg);
      
      // Populate SMTP form
      setSmtpHost(cfg.smtp.host);
      setSmtpPort(cfg.smtp.port);
      setSmtpUsername(cfg.smtp.username);
      setSmtpFromEmail(cfg.smtp.from_email);
      setSmtpFromName(cfg.smtp.from_name);
      setSmtpReplyTo(cfg.smtp.reply_to || '');
      setSmtpEncryption(
        cfg.smtp.encryption === 'Tls' ? 'tls' : 
        cfg.smtp.encryption === 'StartTls' ? 'starttls' : 'none'
      );

      // Populate SendGrid form
      setSendgridFromEmail(cfg.sendgrid.from_email);
      setSendgridFromName(cfg.sendgrid.from_name);
      setSendgridReplyTo(cfg.sendgrid.reply_to || '');
      setSendgridTrackingEnabled(cfg.sendgrid.tracking_enabled);
      setSendgridSandboxMode(cfg.sendgrid.sandbox_mode);

      // Rate limits
      setRateLimitPerMinute(cfg.rate_limit_per_minute);
      setRateLimitPerHour(cfg.rate_limit_per_hour);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const st = await EmailService.Status.getStatus();
      setStatus(st);
    } catch (err) {
      log.error('Failed to load email status:', err);
    }
  };

  const handleSetActiveProvider = async (provider: 'smtp' | 'sendgrid' | 'none') => {
    try {
      setSaving(true);
      const newConfig = await EmailService.Config.setActiveProvider(provider);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set provider');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSMTP = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const newConfig = await EmailService.Config.configureSMTP({
        host: smtpHost,
        port: smtpPort,
        username: smtpUsername,
        password: smtpPassword,
        encryption: smtpEncryption,
        fromEmail: smtpFromEmail,
        fromName: smtpFromName,
        replyTo: smtpReplyTo || undefined,
      });
      
      setConfig(newConfig);
      onConfigChange?.(newConfig);
      await loadStatus();
      setConnectionTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SMTP configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSendGrid = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const newConfig = await EmailService.Config.configureSendGrid({
        apiKey: sendgridApiKey,
        fromEmail: sendgridFromEmail,
        fromName: sendgridFromName,
        replyTo: sendgridReplyTo || undefined,
        trackingEnabled: sendgridTrackingEnabled,
        sandboxMode: sendgridSandboxMode,
      });
      
      setConfig(newConfig);
      onConfigChange?.(newConfig);
      await loadStatus();
      setConnectionTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SendGrid configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRateLimits = async () => {
    try {
      setSaving(true);
      const newConfig = await EmailService.Config.setRateLimits(rateLimitPerMinute, rateLimitPerHour);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate limits');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider?: 'smtp' | 'sendgrid') => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);
      const result = await EmailService.Test.testConnection(provider);
      setConnectionTestResult(result);
    } catch (err) {
      setConnectionTestResult({
        success: false,
        provider: provider === 'smtp' ? 'SMTP' : provider === 'sendgrid' ? 'SendGrid' : 'None',
        message: err instanceof Error ? err.message : 'Connection test failed',
        latency_ms: 0,
        details: null,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;
    
    try {
      setSendingTestEmail(true);
      setTestEmailResult(null);
      const result = await EmailService.Test.sendTestEmail(testEmailAddress);
      setTestEmailResult(result);
      await loadStatus();
    } catch (err) {
      setTestEmailResult({
        success: false,
        message_id: null,
        provider: config?.active_provider || 'None',
        recipient: testEmailAddress,
        error: err instanceof Error ? err.message : 'Failed to send test email',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getProviderIcon = (provider: EmailProvider) => {
    switch (provider) {
      case 'SMTP': return <Server className="h-4 w-4" />;
      case 'SendGrid': return <Zap className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Email Service Status</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={loadStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {status?.configured ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Provider</p>
              <div className="flex items-center gap-2">
                {getProviderIcon(status?.active_provider || 'None')}
                <span className="font-medium">{status?.active_provider || 'None'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Emails This Minute</p>
              <p className="font-medium">
                {status?.emails_sent_this_minute || 0} / {status?.rate_limit_per_minute || 60}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Emails This Hour</p>
              <p className="font-medium">
                {status?.emails_sent_this_hour || 0} / {status?.rate_limit_per_hour || 1000}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>Select which email service to use for sending emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleSetActiveProvider('smtp')}
              disabled={saving || !status?.smtp_configured}
              className={`p-4 rounded-lg border-2 transition-all ${
                config?.active_provider === 'SMTP'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-border hover:border-blue-500/50'
              } ${!status?.smtp_configured ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Server className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">SMTP</p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.smtp_configured ? 'Configured' : 'Not configured'}
              </p>
            </button>
            
            <button
              onClick={() => handleSetActiveProvider('sendgrid')}
              disabled={saving || !status?.sendgrid_configured}
              className={`p-4 rounded-lg border-2 transition-all ${
                config?.active_provider === 'SendGrid'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-border hover:border-purple-500/50'
              } ${!status?.sendgrid_configured ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="font-medium">SendGrid</p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.sendgrid_configured ? 'Configured' : 'Not configured'}
              </p>
            </button>
            
            <button
              onClick={() => handleSetActiveProvider('none')}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                config?.active_provider === 'None'
                  ? 'border-gray-500 bg-gray-500/10'
                  : 'border-border hover:border-gray-500/50'
              }`}
            >
              <XCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium">Disabled</p>
              <p className="text-xs text-muted-foreground mt-1">No email sending</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Provider Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>Configure your email service credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="smtp">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smtp" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                SMTP Server
              </TabsTrigger>
              <TabsTrigger value="sendgrid" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                SendGrid API
              </TabsTrigger>
            </TabsList>

            {/* SMTP Configuration */}
            <TabsContent value="smtp" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Port</label>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password / App Password</label>
                  <div className="relative">
                    <Input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Encryption</label>
                <Select value={smtpEncryption} onValueChange={(v: 'tls' | 'starttls' | 'none') => setSmtpEncryption(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starttls">STARTTLS (Port 587)</SelectItem>
                    <SelectItem value="tls">TLS/SSL (Port 465)</SelectItem>
                    <SelectItem value="none">None (Port 25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Email</label>
                  <Input
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <Input
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="Your Company"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reply-To (Optional)</label>
                <Input
                  type="email"
                  value={smtpReplyTo}
                  onChange={(e) => setSmtpReplyTo(e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection('smtp')}
                  disabled={testingConnection || !smtpHost}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button onClick={handleSaveSMTP} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save SMTP Settings
                </Button>
              </div>

              {/* Common SMTP Settings Info */}
              <div className="p-4 bg-muted rounded-lg mt-4">
                <p className="text-sm font-medium mb-2">Common SMTP Settings:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><strong>Gmail:</strong> smtp.gmail.com:587 (STARTTLS) - Use App Password</li>
                  <li><strong>Outlook:</strong> smtp.office365.com:587 (STARTTLS)</li>
                  <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (STARTTLS)</li>
                  <li><strong>Amazon SES:</strong> email-smtp.us-east-1.amazonaws.com:587</li>
                </ul>
              </div>
            </TabsContent>

            {/* SendGrid Configuration */}
            <TabsContent value="sendgrid" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SendGrid API Key</label>
                <div className="relative">
                  <Input
                    type={showSendgridKey ? 'text' : 'password'}
                    value={sendgridApiKey}
                    onChange={(e) => setSendgridApiKey(e.target.value)}
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowSendgridKey(!showSendgridKey)}
                  >
                    {showSendgridKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://app.sendgrid.com/settings/api_keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    SendGrid Dashboard
                  </a>
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Email</label>
                  <Input
                    type="email"
                    value={sendgridFromEmail}
                    onChange={(e) => setSendgridFromEmail(e.target.value)}
                    placeholder="noreply@yourcompany.com"
                  />
                  <p className="text-xs text-muted-foreground">Must be verified in SendGrid</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <Input
                    value={sendgridFromName}
                    onChange={(e) => setSendgridFromName(e.target.value)}
                    placeholder="Your Company"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reply-To (Optional)</label>
                <Input
                  type="email"
                  value={sendgridReplyTo}
                  onChange={(e) => setSendgridReplyTo(e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Email Tracking</label>
                    <p className="text-xs text-muted-foreground">Track opens and clicks</p>
                  </div>
                  <Button
                    variant={sendgridTrackingEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSendgridTrackingEnabled(!sendgridTrackingEnabled)}
                  >
                    {sendgridTrackingEnabled ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Sandbox Mode</label>
                    <p className="text-xs text-muted-foreground">Test without sending real emails</p>
                  </div>
                  <Button
                    variant={sendgridSandboxMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSendgridSandboxMode(!sendgridSandboxMode)}
                  >
                    {sendgridSandboxMode ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection('sendgrid')}
                  disabled={testingConnection || !sendgridApiKey}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button onClick={handleSaveSendGrid} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save SendGrid Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Connection Test Result */}
          {connectionTestResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              connectionTestResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {connectionTestResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">{connectionTestResult.message}</span>
              </div>
              {connectionTestResult.latency_ms > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Latency: {connectionTestResult.latency_ms}ms
                </p>
              )}
              {connectionTestResult.details && (
                <p className="text-sm text-muted-foreground mt-1">
                  {connectionTestResult.details}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Rate Limiting</CardTitle>
          </div>
          <CardDescription>Protect your sender reputation with rate limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Emails per Minute</label>
              <Input
                type="number"
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value) || 60)}
                min={1}
                max={1000}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Emails per Hour</label>
              <Input
                type="number"
                value={rateLimitPerHour}
                onChange={(e) => setRateLimitPerHour(parseInt(e.target.value) || 1000)}
                min={1}
                max={100000}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveRateLimits} disabled={saving}>
              Save Rate Limits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <CardTitle>Send Test Email</CardTitle>
          </div>
          <CardDescription>Verify your configuration by sending a test email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="your-email@example.com"
              className="flex-1"
            />
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || !testEmailAddress || config?.active_provider === 'None'}
            >
              {sendingTestEmail ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </div>

          {testEmailResult && (
            <div className={`p-4 rounded-lg ${
              testEmailResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {testEmailResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {testEmailResult.success ? 'Test email sent successfully!' : 'Failed to send test email'}
                </span>
              </div>
              {testEmailResult.message_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  Message ID: {testEmailResult.message_id}
                </p>
              )}
              {testEmailResult.error && (
                <p className="text-sm text-red-500 mt-1">
                  Error: {testEmailResult.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSettings;
