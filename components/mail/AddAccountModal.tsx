'use client';

/**
 * CUBE Mail - Add Account Modal
 * 
 * Multi-step wizard for adding email accounts with support for:
 * - Quick setup (Gmail, Outlook, Yahoo, iCloud, ProtonMail)
 * - Manual IMAP/SMTP configuration
 * - OAuth2 authentication flow
 * - Connection testing
 * 
 * @version 1.1.0
 */

import React, { useState, useCallback } from 'react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Server,
  User,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mailService } from '@/lib/services/mail-service';
import { oauth2Service, DEFAULT_SCOPES } from '@/lib/services/mail-oauth2-service';
import { MAIL_PROVIDER_CONFIGS } from '@/lib/types/mail';
import type { MailProvider, ConnectionSecurity, MailAccount } from '@/lib/types/mail';

import './AddAccountModal.css';

// ============================================================================
// TYPES
// ============================================================================

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onAccountAdded?: (account: MailAccount) => void;
}

interface ProviderOption {
  id: MailProvider;
  name: string;
  icon: string;
  description: string;
  supportsOAuth: boolean;
  color: string;
}

type WizardStep = 'provider' | 'credentials' | 'manual' | 'testing' | 'success';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROVIDERS: ProviderOption[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    description: 'Google Mail with OAuth2',
    supportsOAuth: true,
    color: '#EA4335',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '📬',
    description: 'Microsoft 365 & Outlook.com',
    supportsOAuth: true,
    color: '#0078D4',
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    icon: '📨',
    description: 'Yahoo Mail with app password',
    supportsOAuth: false,
    color: '#6001D2',
  },
  {
    id: 'icloud',
    name: 'iCloud',
    icon: '☁️',
    description: 'Apple iCloud Mail',
    supportsOAuth: false,
    color: '#3693F3',
  },
  {
    id: 'protonmail',
    name: 'ProtonMail',
    icon: '🔒',
    description: 'Secure encrypted email',
    supportsOAuth: false,
    color: '#6D4AFF',
  },
  {
    id: 'custom',
    name: 'Other / Custom',
    icon: '⚙️',
    description: 'Manual IMAP/SMTP setup',
    supportsOAuth: false,
    color: '#6B7280',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
  onAccountAdded,
}: AddAccountModalProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  
  // Manual config state
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [useSSL, setUseSSL] = useState(true);
  
  // Testing state
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedAccount, setAddedAccount] = useState<MailAccount | null>(null);

  // Reset form
  const resetForm = useCallback(() => {
    setStep('provider');
    setSelectedProvider(null);
    setEmail('');
    setPassword('');
    setName('');
    setImapHost('');
    setImapPort('993');
    setSmtpHost('');
    setSmtpPort('587');
    setUseSSL(true);
    setTestResult(null);
    setError(null);
    setShowPassword(false);
    setAddedAccount(null);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Select provider
  const handleSelectProvider = useCallback((provider: ProviderOption) => {
    setSelectedProvider(provider);
    setError(null);
    
    // Auto-fill known provider settings
    if (provider.id !== 'custom') {
      const config = MAIL_PROVIDER_CONFIGS[provider.id];
      if (config) {
        setImapHost(config.imap.host || '');
        setImapPort(String(config.imap.port || 993));
        setSmtpHost(config.smtp.host || '');
        setSmtpPort(String(config.smtp.port || 587));
        setUseSSL(config.imap.security === 'SSL');
      }
    }
    
    if (provider.id === 'custom') {
      setStep('manual');
    } else {
      setStep('credentials');
    }
  }, []);

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Map provider to OAuth2Provider type
      const oauthProvider = selectedProvider.id === 'gmail' ? 'google' 
        : selectedProvider.id === 'outlook' ? 'microsoft'
        : selectedProvider.id === 'yahoo' ? 'yahoo'
        : null;
      
      if (!oauthProvider) {
        throw new Error('OAuth not supported for this provider. Please use manual setup.');
      }
      
      // Check if provider is registered, if not register with default config
      if (!oauth2Service.isProviderRegistered(oauthProvider)) {
        // In production, these would come from environment variables
        const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '';
        const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/mail/oauth/callback';
        
        if (!clientId) {
          throw new Error('OAuth2 not configured. Please add OAuth credentials or use manual setup with app password.');
        }
        
        await oauth2Service.registerProvider({
          provider: oauthProvider,
          clientId,
          redirectUri,
          scopes: DEFAULT_SCOPES[oauthProvider],
        });
      }
      
      // Get authorization URL
      const { authUrl, state } = await oauth2Service.getAuthorizationUrl(oauthProvider);
      
      // Store state for verification
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', oauthProvider);
      sessionStorage.setItem('oauth_account_name', name || email.split('@')[0] || 'My Account');
      
      // Open OAuth consent page in new window
      const oauthWindow = window.open(authUrl, 'oauth', 'width=500,height=600');
      
      if (!oauthWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      
      // Poll for OAuth completion
      const pollInterval = setInterval(() => {
        try {
          if (oauthWindow.closed) {
            clearInterval(pollInterval);
            setIsLoading(false);
            // Check if we got tokens in localStorage (set by callback)
            const tokens = sessionStorage.getItem('oauth_tokens');
            if (tokens) {
              sessionStorage.removeItem('oauth_tokens');
              const { accessToken, refreshToken, userEmail, userName } = JSON.parse(tokens);
              
              // Create account with OAuth tokens
              oauth2Service.addAccountWithOAuth(
                userEmail || email,
                userName || name || email.split('@')[0],
                oauthProvider,
                accessToken,
                refreshToken
              ).then(() => {
                setTestResult({
                  success: true,
                  message: 'Account added successfully!',
                  details: `Connected as ${userEmail || email}`,
                });
                setStep('success');
              }).catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to create account');
              });
            }
          }
        } catch {
          // Cross-origin error - window is still open
        }
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth login failed');
      setIsLoading(false);
    }
  }, [selectedProvider, email, name]);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    if (!email || (!password && selectedProvider?.id !== 'custom')) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    setStep('testing');
    
    try {
      // Add the account
      const security: ConnectionSecurity = useSSL ? 'SSL' : 'STARTTLS';
      const account = await mailService.addAccount({
        email,
        name: name || email.split('@')[0],
        provider: selectedProvider?.id || 'custom',
        imap: {
          host: imapHost,
          port: parseInt(imapPort, 10),
          security,
          username: email,
          password,
        },
        smtp: {
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          security: parseInt(smtpPort, 10) === 465 ? 'SSL' : 'STARTTLS',
          username: email,
          password,
        },
      });
      
      // Store account for success callback
      setAddedAccount(account);
      
      setTestResult({
        success: true,
        message: 'Account added successfully!',
        details: `Connected as ${email}`,
      });
      
      setStep('success');
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Connection failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, selectedProvider, imapHost, imapPort, smtpHost, smtpPort, useSSL]);

  // Handle success
  const handleSuccess = useCallback(() => {
    if (onAccountAdded && addedAccount) {
      onAccountAdded(addedAccount);
    }
    onSuccess?.();
    handleClose();
  }, [onSuccess, onAccountAdded, addedAccount, handleClose]);

  // Go back
  const handleBack = useCallback(() => {
    setError(null);
    setTestResult(null);
    
    switch (step) {
      case 'credentials':
      case 'manual':
        setStep('provider');
        break;
      case 'testing':
        setStep(selectedProvider?.id === 'custom' ? 'manual' : 'credentials');
        break;
      default:
        break;
    }
  }, [step, selectedProvider]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="add-account-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Add Email Account
          </DialogTitle>
          <DialogDescription>
            {step === 'provider' && 'Choose your email provider to get started'}
            {step === 'credentials' && `Sign in to ${selectedProvider?.name}`}
            {step === 'manual' && 'Enter your email server settings'}
            {step === 'testing' && 'Testing your connection...'}
            {step === 'success' && 'Account added successfully!'}
          </DialogDescription>
        </DialogHeader>

        <div className="add-account-modal__content">
          {/* Step Indicator */}
          <div className="add-account-modal__steps">
            <StepIndicator 
              step={1} 
              label="Provider" 
              active={step === 'provider'}
              completed={step !== 'provider'}
            />
            <div className="add-account-modal__step-line" />
            <StepIndicator 
              step={2} 
              label="Credentials" 
              active={step === 'credentials' || step === 'manual'}
              completed={step === 'testing' || step === 'success'}
            />
            <div className="add-account-modal__step-line" />
            <StepIndicator 
              step={3} 
              label="Connect" 
              active={step === 'testing' || step === 'success'}
              completed={step === 'success'}
            />
          </div>

          {/* Step: Provider Selection */}
          {step === 'provider' && (
            <div className="add-account-modal__providers">
              {PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  className="add-account-modal__provider-card"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div 
                    className="add-account-modal__provider-icon"
                    style={{ background: `${provider.color}20` }}
                  >
                    <span className="text-2xl">{provider.icon}</span>
                  </div>
                  <div className="add-account-modal__provider-info">
                    <h4>{provider.name}</h4>
                    <p>{provider.description}</p>
                  </div>
                  {provider.supportsOAuth && (
                    <div className="add-account-modal__oauth-badge">
                      <Shield className="h-3 w-3" />
                      OAuth
                    </div>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Step: Credentials */}
          {step === 'credentials' && selectedProvider && (
            <div className="add-account-modal__form">
              <div className="add-account-modal__provider-header">
                <span className="text-3xl">{selectedProvider.icon}</span>
                <h3>{selectedProvider.name}</h3>
              </div>

              {selectedProvider.supportsOAuth && (
                <Button 
                  className="add-account-modal__oauth-btn"
                  onClick={handleOAuthLogin}
                  disabled={isLoading}
                  style={{ background: selectedProvider.color }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Sign in with {selectedProvider.name}
                </Button>
              )}

              {selectedProvider.supportsOAuth && (
                <div className="add-account-modal__divider">
                  <span>or enter credentials manually</span>
                </div>
              )}

              <div className="add-account-modal__field">
                <Label htmlFor="email">Email Address</Label>
                <div className="add-account-modal__input-wrapper">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="add-account-modal__field">
                <Label htmlFor="password">
                  {selectedProvider.id === 'gmail' || selectedProvider.id === 'yahoo' 
                    ? 'App Password' 
                    : 'Password'}
                </Label>
                <div className="add-account-modal__input-wrapper">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="add-account-modal__toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {(selectedProvider.id === 'gmail' || selectedProvider.id === 'yahoo') && (
                  <p className="add-account-modal__hint">
                    <AlertCircle className="h-3 w-3" />
                    You need to create an app-specific password in your account settings
                  </p>
                )}
              </div>

              <div className="add-account-modal__field">
                <Label htmlFor="name">Display Name (optional)</Label>
                <div className="add-account-modal__input-wrapper">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="add-account-modal__error">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Manual Configuration */}
          {step === 'manual' && (
            <div className="add-account-modal__form">
              <div className="add-account-modal__provider-header">
                <Server className="h-8 w-8 text-muted-foreground" />
                <h3>Manual Setup</h3>
              </div>

              <div className="add-account-modal__section">
                <h4>Account</h4>
                <div className="add-account-modal__field">
                  <Label htmlFor="email-manual">Email Address</Label>
                  <Input
                    id="email-manual"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="add-account-modal__field">
                  <Label htmlFor="password-manual">Password</Label>
                  <Input
                    id="password-manual"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="add-account-modal__field">
                  <Label htmlFor="name-manual">Display Name</Label>
                  <Input
                    id="name-manual"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="add-account-modal__section">
                <h4>Incoming Mail (IMAP)</h4>
                <div className="add-account-modal__row">
                  <div className="add-account-modal__field flex-1">
                    <Label htmlFor="imap-host">Server</Label>
                    <Input
                      id="imap-host"
                      type="text"
                      placeholder="imap.example.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                    />
                  </div>
                  <div className="add-account-modal__field w-24">
                    <Label htmlFor="imap-port">Port</Label>
                    <Input
                      id="imap-port"
                      type="text"
                      placeholder="993"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="add-account-modal__section">
                <h4>Outgoing Mail (SMTP)</h4>
                <div className="add-account-modal__row">
                  <div className="add-account-modal__field flex-1">
                    <Label htmlFor="smtp-host">Server</Label>
                    <Input
                      id="smtp-host"
                      type="text"
                      placeholder="smtp.example.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div className="add-account-modal__field w-24">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input
                      id="smtp-port"
                      type="text"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="add-account-modal__section">
                <h4>Security</h4>
                <div className="add-account-modal__toggle">
                  <Label htmlFor="use-ssl">Use SSL/TLS</Label>
                  <Switch
                    id="use-ssl"
                    checked={useSSL}
                    onCheckedChange={setUseSSL}
                  />
                </div>
              </div>

              {error && (
                <div className="add-account-modal__error">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Testing */}
          {step === 'testing' && (
            <div className="add-account-modal__testing">
              {isLoading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                  <h3>Testing Connection...</h3>
                  <p>Connecting to {email}</p>
                </>
              ) : testResult ? (
                <>
                  {testResult.success ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  )}
                  <h3>{testResult.message}</h3>
                  <p>{testResult.details}</p>
                </>
              ) : null}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="add-account-modal__success">
              <div className="add-account-modal__success-icon">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <h3>Account Added!</h3>
              <p>Your email account has been configured successfully.</p>
              <Card className="add-account-modal__success-card">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="add-account-modal__success-avatar"
                      style={{ background: selectedProvider?.color || '#3b82f6' }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{name || email.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="add-account-modal__footer">
          {step !== 'provider' && step !== 'success' && (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex-1" />
          
          {step === 'provider' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {(step === 'credentials' || step === 'manual') && (
            <Button onClick={handleTestConnection} disabled={isLoading || !email}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Connect
            </Button>
          )}
          
          {step === 'testing' && !isLoading && testResult && !testResult.success && (
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {step === 'success' && (
            <Button onClick={handleSuccess}>
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className={cn(
      'add-account-modal__step',
      active && 'add-account-modal__step--active',
      completed && 'add-account-modal__step--completed'
    )}>
      <div className="add-account-modal__step-number">
        {completed ? <Check className="h-3 w-3" /> : step}
      </div>
      <span className="add-account-modal__step-label">{label}</span>
    </div>
  );
}

export default AddAccountModal;
