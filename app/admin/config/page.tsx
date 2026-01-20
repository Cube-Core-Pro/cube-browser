'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Key, Mail, CreditCard, Globe, Shield,
  Eye, EyeOff, Save, RotateCcw, Check, X, AlertTriangle,
  Loader2, ChevronDown, ChevronRight, Sparkles, Server,
  ToggleLeft, ToggleRight, RefreshCw, Database, Zap
} from 'lucide-react';
import './config.css';

interface ConfigItem {
  value: string;
  masked: string;
  isSet: boolean;
}

interface ConfigGroup {
  [key: string]: string[];
}

interface ConfigData {
  config: Record<string, ConfigItem>;
  groups: ConfigGroup;
}

interface EditingState {
  [key: string]: string;
}

interface SavingState {
  [key: string]: boolean;
}

interface ExpandedState {
  [key: string]: boolean;
}

const groupIcons: Record<string, React.ReactNode> = {
  ai: <Sparkles className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  general: <Globe className="w-5 h-5" />,
  features: <ToggleRight className="w-5 h-5" />
};

const groupTitles: Record<string, string> = {
  ai: 'AI Configuration (OpenAI)',
  stripe: 'Payment Gateway (Stripe)',
  email: 'Email Server (SMTP)',
  general: 'General Settings',
  features: 'Feature Flags'
};

const groupDescriptions: Record<string, string> = {
  ai: 'Configure OpenAI API for AI-powered features like smart chat and automation suggestions.',
  stripe: 'Set up Stripe for payment processing, subscriptions, and checkout.',
  email: 'Configure SMTP server for transactional emails, password resets, and notifications.',
  general: 'General site configuration including URLs and analytics.',
  features: 'Enable or disable specific platform features.'
};

const fieldDescriptions: Record<string, string> = {
  OPENAI_API_KEY: 'Your OpenAI API key (starts with sk-proj-...)',
  OPENAI_MODEL: 'The GPT model to use (e.g., gpt-4-turbo-preview)',
  STRIPE_SECRET_KEY: 'Stripe secret key (starts with sk_live_PLACEHOLDER or sk_test_PLACEHOLDER)',
  STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key (starts with pk_live_PLACEHOLDER or pk_test_PLACEHOLDER)',
  STRIPE_WEBHOOK_SECRET: 'Webhook signing secret (starts with whsec_)',
  SMTP_HOST: 'SMTP server hostname (e.g., smtp.gmail.com)',
  SMTP_PORT: 'SMTP port (usually 587 for TLS or 465 for SSL)',
  SMTP_USER: 'SMTP username (usually your email address)',
  SMTP_PASSWORD: 'SMTP password or app-specific password',
  SMTP_FROM: 'Default sender email address',
  SMTP_FROM_NAME: 'Default sender name',
  SITE_URL: 'Public URL of your site (e.g., https://cubeai.tools)',
  SITE_NAME: 'Display name of your platform',
  GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID (G-XXXXXXXXXX)',
  ENABLE_AI_CHAT: 'Enable AI chat widget across the platform',
  ENABLE_STRIPE: 'Enable Stripe payment processing',
  ENABLE_EMAIL: 'Enable email notifications and transactional emails',
  MAINTENANCE_MODE: 'Put the entire site in maintenance mode'
};

export default function SuperAdminConfigPage(): React.ReactElement {
  const router = useRouter();
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>({});
  const [saving, setSaving] = useState<SavingState>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<ExpandedState>({
    ai: true,
    stripe: true,
    email: true,
    general: false,
    features: false
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('cube_token');
      
      const response = await fetch('/api/admin/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      setConfigData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleEdit = (key: string, value: string): void => {
    setEditing(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string): Promise<void> => {
    if (!editing[key] && editing[key] !== '') return;

    setSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const token = localStorage.getItem('cube_token');
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key,
          value: editing[key]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      // Refresh config
      await fetchConfig();
      
      // Clear editing state
      setEditing(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });

      setSuccessMessage(`${key} saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCancel = (key: string): void => {
    setEditing(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const handleReset = async (key: string): Promise<void> => {
    if (!confirm(`Are you sure you want to reset ${key} to its default value?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('cube_token');
      await fetch(`/api/admin/config?key=${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      await fetchConfig();
      setSuccessMessage(`${key} reset to default`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    }
  };

  const toggleExpanded = (group: string): void => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleShowValue = (key: string): void => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testConnection = async (type: string): Promise<void> => {
    setTestingConnection(type);
    
    try {
      const token = localStorage.getItem('cube_token');
      const response = await fetch(`/api/admin/config/test?type=${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`${type.toUpperCase()} connection test successful!`);
      } else {
        setError(`${type.toUpperCase()} test failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  const isFeatureToggle = (key: string): boolean => {
    return key.startsWith('ENABLE_') || key === 'MAINTENANCE_MODE';
  };

  const renderConfigField = (key: string, item: ConfigItem): React.ReactElement => {
    const isEditing = key in editing;
    const isSaving = saving[key];
    const isToggle = isFeatureToggle(key);
    const showValue = showValues[key];
    const isSensitive = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'].some(s => key.includes(s));

    if (isToggle) {
      const currentValue = editing[key] ?? (item.isSet ? item.masked : 'false');
      const isEnabled = currentValue === 'true';

      return (
        <div className="config-field config-field--toggle">
          <div className="config-field__info">
            <label className="config-field__label">{key.replace(/_/g, ' ')}</label>
            <p className="config-field__description">{fieldDescriptions[key]}</p>
          </div>
          <button
            type="button"
            className={`toggle-button ${isEnabled ? 'toggle-button--on' : 'toggle-button--off'}`}
            onClick={() => {
              const newValue = isEnabled ? 'false' : 'true';
              setEditing(prev => ({ ...prev, [key]: newValue }));
              // Auto-save toggles
              setTimeout(() => handleSave(key), 100);
            }}
            disabled={isSaving}
          >
            {isEnabled ? (
              <ToggleRight className="w-8 h-8" />
            ) : (
              <ToggleLeft className="w-8 h-8" />
            )}
            <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="config-field">
        <div className="config-field__header">
          <label className="config-field__label">{key.replace(/_/g, ' ')}</label>
          <div className="config-field__status">
            {item.isSet ? (
              <span className="status-badge status-badge--configured">
                <Check className="w-3 h-3" /> Configured
              </span>
            ) : (
              <span className="status-badge status-badge--not-set">
                <AlertTriangle className="w-3 h-3" /> Not Set
              </span>
            )}
          </div>
        </div>
        <p className="config-field__description">{fieldDescriptions[key]}</p>
        
        <div className="config-field__input-group">
          {isEditing ? (
            <>
              <div className="input-wrapper">
                <input
                  type={isSensitive && !showValue ? 'password' : 'text'}
                  value={editing[key]}
                  onChange={(e) => handleEdit(key, e.target.value)}
                  placeholder={`Enter ${key.toLowerCase().replace(/_/g, ' ')}`}
                  className="config-input"
                  disabled={isSaving}
                />
                {isSensitive && (
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => toggleShowValue(key)}
                  >
                    {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="config-field__actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={() => handleSave(key)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => handleCancel(key)}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="config-value">
                {item.isSet ? (
                  <code>{item.masked}</code>
                ) : (
                  <span className="not-set">Not configured</span>
                )}
              </div>
              <div className="config-field__actions">
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => handleEdit(key, '')}
                >
                  <Key className="w-4 h-4" />
                  {item.isSet ? 'Change' : 'Set'}
                </button>
                {item.isSet && (
                  <button
                    type="button"
                    className="btn-reset"
                    onClick={() => handleReset(key)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="config-page config-page--loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading configuration...</p>
      </div>
    );
  }

  if (!configData) {
    return (
      <div className="config-page config-page--error">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load configuration</p>
        <button onClick={fetchConfig} className="btn-retry">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="config-page">
      {/* Header */}
      <header className="config-header">
        <div className="config-header__title">
          <Settings className="w-8 h-8" />
          <div>
            <h1>System Configuration</h1>
            <p>Manage API keys, integrations, and platform settings</p>
          </div>
        </div>
        <div className="config-header__actions">
          <button onClick={fetchConfig} className="btn-refresh">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* Notifications */}
      {successMessage && (
        <div className="notification notification--success">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="notification notification--error">
          <AlertTriangle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Configuration Groups */}
      <div className="config-groups">
        {Object.entries(configData.groups).map(([group, keys]) => (
          <div key={group} className={`config-group ${expanded[group] ? 'config-group--expanded' : ''}`}>
            <button
              type="button"
              className="config-group__header"
              onClick={() => toggleExpanded(group)}
            >
              <div className="config-group__icon">
                {groupIcons[group]}
              </div>
              <div className="config-group__info">
                <h2>{groupTitles[group]}</h2>
                <p>{groupDescriptions[group]}</p>
              </div>
              <div className="config-group__status">
                {keys.filter(k => configData.config[k]?.isSet).length}/{keys.length} configured
              </div>
              <div className="config-group__chevron">
                {expanded[group] ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </button>

            {expanded[group] && (
              <div className="config-group__content">
                {/* Test Connection Button */}
                {(group === 'ai' || group === 'stripe' || group === 'email') && (
                  <div className="test-connection">
                    <button
                      type="button"
                      className="btn-test"
                      onClick={() => testConnection(group)}
                      disabled={testingConnection === group}
                    >
                      {testingConnection === group ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Test {groupTitles[group].split('(')[0]} Connection
                    </button>
                  </div>
                )}

                {/* Fields */}
                <div className="config-fields">
                  {keys.map(key => (
                    <div key={key}>
                      {configData.config[key] && renderConfigField(key, configData.config[key])}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="config-stats">
        <div className="stat-card">
          <Database className="w-6 h-6" />
          <div>
            <span className="stat-value">
              {Object.values(configData.config).filter(c => c.isSet).length}
            </span>
            <span className="stat-label">Configured</span>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <span className="stat-value">
              {Object.values(configData.config).filter(c => !c.isSet).length}
            </span>
            <span className="stat-label">Not Set</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield className="w-6 h-6" />
          <div>
            <span className="stat-value">Encrypted</span>
            <span className="stat-label">Storage</span>
          </div>
        </div>
        <div className="stat-card">
          <Server className="w-6 h-6" />
          <div>
            <span className="stat-value">Railway</span>
            <span className="stat-label">Environment</span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="config-help">
        <h3>Need Help?</h3>
        <div className="help-links">
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
            Get OpenAI API Key →
          </a>
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
            Get Stripe Keys →
          </a>
          <a href="https://docs.railway.app/guides/variables" target="_blank" rel="noopener noreferrer">
            Railway Environment Variables →
          </a>
        </div>
      </div>
    </div>
  );
}
