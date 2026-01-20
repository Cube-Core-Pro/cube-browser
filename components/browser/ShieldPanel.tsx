/**
 * CUBE Shield Panel Component
 * 
 * UI for controlling CUBE Shield - the ultimate ad/tracker blocker
 * Superior to Brave Shields with AI-powered protection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  ShieldAlert,
  Eye,
  EyeOff,
  Cookie,
  Fingerprint,
  Zap,
  Lock,
  Unlock,
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Globe,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import { 
  CubeShieldService, 
  ShieldConfig, 
  ShieldStats,
  ShieldLevel,
  ShieldPreset,
  CookieBlockingLevel,
  createCustomRule,
  formatDataSaved,
  getShieldLevelDescription,
  getFeatureDescription
} from '@/lib/services/browser-shield-service';
import './ShieldPanel.css';

const log = logger.scope('ShieldPanel');

interface ShieldPanelProps {
  domain?: string;
  compact?: boolean;
  onConfigChange?: (config: ShieldConfig) => void;
}

const ShieldPanel: React.FC<ShieldPanelProps> = ({
  domain,
  compact = false,
  onConfigChange
}) => {
  // State
  const [config, setConfig] = useState<ShieldConfig | null>(null);
  const [stats, setStats] = useState<ShieldStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('protection');
  const [showCustomRuleModal, setShowCustomRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '' });

  // Load configuration and stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [configData, statsData] = await Promise.all([
        domain 
          ? CubeShieldService.getSiteConfig(domain)
          : CubeShieldService.getConfig(),
        CubeShieldService.getStats()
      ]);

      setConfig(configData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Shield config');
      log.error('[Shield Panel] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle shield enabled
  const handleToggleEnabled = async () => {
    if (!config) return;
    
    try {
      const newEnabled = !config.enabled;
      await CubeShieldService.setEnabled(newEnabled);
      
      const newConfig = { ...config, enabled: newEnabled };
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      log.error('[Shield Panel] Toggle error:', err);
    }
  };

  // Change shield level
  const handleLevelChange = async (level: ShieldLevel) => {
    if (!config) return;

    try {
      await CubeShieldService.setLevel(level);
      
      const newConfig = { ...config, level };
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      log.error('[Shield Panel] Level change error:', err);
    }
  };

  // Toggle feature - type-safe feature keys
  type ToggleableFeature = 
    | 'ad_blocking' 
    | 'tracker_blocking' 
    | 'fingerprint_protection' 
    | 'script_blocking' 
    | 'social_blocking' 
    | 'crypto_mining_blocking' 
    | 'malware_blocking' 
    | 'https_upgrade' 
    | 'webrtc_protection' 
    | 'canvas_protection' 
    | 'font_protection' 
    | 'battery_api_blocking' 
    | 'hardware_concurrency_spoof';

  const handleToggleFeature = async (feature: ToggleableFeature) => {
    if (!config) return;

    try {
      const currentValue = config[feature];
      await CubeShieldService.toggleFeature(feature, !currentValue);
      
      const newConfig = { ...config, [feature]: !currentValue };
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      log.error('[Shield Panel] Feature toggle error:', err);
    }
  };

  // Apply preset
  const handleApplyPreset = async (preset: ShieldPreset) => {
    try {
      const newConfig = await CubeShieldService.applyPreset(preset);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      log.error('[Shield Panel] Preset error:', err);
    }
  };

  // Add whitelist
  const handleWhitelist = async () => {
    if (!domain) return;

    try {
      await CubeShieldService.whitelistAdd(domain);
      await loadData();
    } catch (err) {
      log.error('[Shield Panel] Whitelist error:', err);
    }
  };

  // Add custom rule
  const handleAddCustomRule = async () => {
    if (!newRule.name || !newRule.pattern) return;

    try {
      const rule = createCustomRule(newRule.name, newRule.pattern);
      await CubeShieldService.addCustomRule(rule);
      
      setNewRule({ name: '', pattern: '' });
      setShowCustomRuleModal(false);
      await loadData();
    } catch (err) {
      log.error('[Shield Panel] Add rule error:', err);
    }
  };

  // Remove custom rule
  const handleRemoveRule = async (ruleId: string) => {
    try {
      await CubeShieldService.removeCustomRule(ruleId);
      await loadData();
    } catch (err) {
      log.error('[Shield Panel] Remove rule error:', err);
    }
  };

  // Reset stats
  const handleResetStats = async () => {
    try {
      await CubeShieldService.resetStats();
      setStats({
        ads_blocked: 0,
        trackers_blocked: 0,
        scripts_blocked: 0,
        cookies_blocked: 0,
        fingerprint_attempts_blocked: 0,
        malware_blocked: 0,
        crypto_miners_blocked: 0,
        https_upgrades: 0,
        social_trackers_blocked: 0,
        data_saved_bytes: 0,
        time_saved_ms: 0,
        blocked_by_domain: {},
        blocked_by_category: {},
      });
    } catch (err) {
      log.error('[Shield Panel] Reset stats error:', err);
    }
  };

  // Export config
  const handleExport = async () => {
    try {
      const json = await CubeShieldService.exportConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cube-shield-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      log.error('[Shield Panel] Export error:', err);
    }
  };

  // Import config
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const json = await file.text();
      await CubeShieldService.importConfig(json);
      await loadData();
    } catch (err) {
      log.error('[Shield Panel] Import error:', err);
    }
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get shield icon based on state
  const getShieldIcon = () => {
    if (!config?.enabled) return <ShieldOff className="shield-icon off" />;
    
    switch (config.level) {
      case 'aggressive':
        return <ShieldAlert className="shield-icon aggressive" />;
      case 'strict':
        return <ShieldCheck className="shield-icon strict" />;
      case 'standard':
        return <Shield className="shield-icon standard" />;
      default:
        return <Shield className="shield-icon" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="shield-panel loading">
        <div className="loading-spinner">
          <Shield className="spin" />
        </div>
        <p>Loading CUBE Shield...</p>
      </div>
    );
  }

  // Error state
  if (error || !config) {
    return (
      <div className="shield-panel error">
        <AlertTriangle />
        <p>{error || 'Failed to load Shield configuration'}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <div className={`shield-panel compact ${config.enabled ? 'enabled' : 'disabled'}`}>
        <button 
          className="shield-toggle-compact"
          onClick={handleToggleEnabled}
          title={config.enabled ? 'Shield: ON' : 'Shield: OFF'}
        >
          {getShieldIcon()}
        </button>
        {stats && (
          <span className="shield-stats-compact">
            {stats.ads_blocked + stats.trackers_blocked} blocked
          </span>
        )}
      </div>
    );
  }

  // Full panel
  return (
    <div className={`shield-panel ${config.enabled ? 'enabled' : 'disabled'}`}>
      {/* Header */}
      <div className="shield-header">
        <div className="shield-title">
          {getShieldIcon()}
          <div className="shield-title-text">
            <h3>CUBE Shield</h3>
            {domain && <span className="shield-domain">{domain}</span>}
          </div>
        </div>
        
        <button 
          className={`shield-toggle ${config.enabled ? 'on' : 'off'}`}
          onClick={handleToggleEnabled}
        >
          {config.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Stats Summary */}
      {stats && config.enabled && (
        <div className="shield-stats-summary">
          <div className="stat-item">
            <span className="stat-value">{stats.ads_blocked}</span>
            <span className="stat-label">Ads</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.trackers_blocked}</span>
            <span className="stat-label">Trackers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.fingerprint_attempts_blocked}</span>
            <span className="stat-label">Fingerprints</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatDataSaved(stats.data_saved_bytes)}</span>
            <span className="stat-label">Data Saved</span>
          </div>
        </div>
      )}

      {/* Protection Level */}
      {config.enabled && (
        <>
          <div className="shield-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('level')}
            >
              <div className="section-title">
                <Zap />
                <span>Protection Level</span>
              </div>
              {expandedSection === 'level' ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSection === 'level' && (
              <div className="section-content">
                <div className="level-selector">
                  {(['standard', 'strict', 'aggressive'] as ShieldLevel[]).map(level => (
                    <button
                      key={level}
                      className={`level-btn ${config.level === level ? 'active' : ''}`}
                      onClick={() => handleLevelChange(level)}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="level-description">
                  {getShieldLevelDescription(config.level)}
                </p>
              </div>
            )}
          </div>

          {/* Protection Features */}
          <div className="shield-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('protection')}
            >
              <div className="section-title">
                <Shield />
                <span>Protection Features</span>
              </div>
              {expandedSection === 'protection' ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSection === 'protection' && (
              <div className="section-content">
                <FeatureToggle
                  icon={<Eye />}
                  label="Ad Blocking"
                  description={getFeatureDescription('ad_blocking')}
                  enabled={config.ad_blocking}
                  onChange={() => handleToggleFeature('ad_blocking')}
                />
                <FeatureToggle
                  icon={<EyeOff />}
                  label="Tracker Blocking"
                  description={getFeatureDescription('tracker_blocking')}
                  enabled={config.tracker_blocking}
                  onChange={() => handleToggleFeature('tracker_blocking')}
                />
                <FeatureToggle
                  icon={<Fingerprint />}
                  label="Fingerprint Protection"
                  description={getFeatureDescription('fingerprint_protection')}
                  enabled={config.fingerprint_protection}
                  onChange={() => handleToggleFeature('fingerprint_protection')}
                />
                <FeatureToggle
                  icon={<Globe />}
                  label="Social Media Blocking"
                  description={getFeatureDescription('social_blocking')}
                  enabled={config.social_blocking}
                  onChange={() => handleToggleFeature('social_blocking')}
                />
                <FeatureToggle
                  icon={<AlertTriangle />}
                  label="Crypto Miner Blocking"
                  description={getFeatureDescription('crypto_mining_blocking')}
                  enabled={config.crypto_mining_blocking}
                  onChange={() => handleToggleFeature('crypto_mining_blocking')}
                />
                <FeatureToggle
                  icon={<Lock />}
                  label="HTTPS Upgrade"
                  description={getFeatureDescription('https_upgrade')}
                  enabled={config.https_upgrade}
                  onChange={() => handleToggleFeature('https_upgrade')}
                />
                <FeatureToggle
                  icon={<Shield />}
                  label="WebRTC Protection"
                  description={getFeatureDescription('webrtc_protection')}
                  enabled={config.webrtc_protection}
                  onChange={() => handleToggleFeature('webrtc_protection')}
                />
              </div>
            )}
          </div>

          {/* Cookie Control */}
          <div className="shield-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('cookies')}
            >
              <div className="section-title">
                <Cookie />
                <span>Cookie Control</span>
              </div>
              {expandedSection === 'cookies' ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSection === 'cookies' && (
              <div className="section-content">
                <select 
                  className="cookie-select"
                  value={config.cookie_blocking}
                  onChange={(e) => CubeShieldService.setCookieBlocking(e.target.value as CookieBlockingLevel)}
                  title="Cookie blocking level"
                  aria-label="Cookie blocking level"
                >
                  <option value="allow_all">Allow All Cookies</option>
                  <option value="block_third_party">Block Third-Party</option>
                  <option value="block_all_except_whitelist">Block All Except Whitelist</option>
                  <option value="block_all">Block All Cookies</option>
                </select>
              </div>
            )}
          </div>

          {/* Custom Rules */}
          <div className="shield-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('rules')}
            >
              <div className="section-title">
                <Settings />
                <span>Custom Rules ({config.custom_rules.length})</span>
              </div>
              {expandedSection === 'rules' ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSection === 'rules' && (
              <div className="section-content">
                <button 
                  className="add-rule-btn"
                  onClick={() => setShowCustomRuleModal(true)}
                  title="Add custom blocking rule"
                  aria-label="Add custom blocking rule"
                >
                  <Plus /> Add Rule
                </button>
                
                {config.custom_rules.length > 0 ? (
                  <div className="rules-list">
                    {config.custom_rules.map(rule => (
                      <div key={rule.id} className="rule-item">
                        <div className="rule-info">
                          <span className="rule-name">{rule.name}</span>
                          <span className="rule-pattern">{rule.pattern}</span>
                        </div>
                        <button 
                          className="rule-delete"
                          onClick={() => handleRemoveRule(rule.id)}
                          title="Delete rule"
                          aria-label="Delete rule"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-rules">No custom rules defined</p>
                )}
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="shield-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('presets')}
            >
              <div className="section-title">
                <Zap />
                <span>Quick Presets</span>
              </div>
              {expandedSection === 'presets' ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSection === 'presets' && (
              <div className="section-content presets-grid">
                <button 
                  className="preset-btn balanced"
                  onClick={() => handleApplyPreset('balanced')}
                >
                  Balanced
                </button>
                <button 
                  className="preset-btn privacy"
                  onClick={() => handleApplyPreset('privacy_focused')}
                >
                  Privacy First
                </button>
                <button 
                  className="preset-btn performance"
                  onClick={() => handleApplyPreset('performance')}
                >
                  Performance
                </button>
                <button 
                  className="preset-btn maximum"
                  onClick={() => handleApplyPreset('maximum_protection')}
                >
                  Maximum
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="shield-actions">
        {domain && (
          <button className="action-btn whitelist" onClick={handleWhitelist}>
            <Unlock /> Whitelist Site
          </button>
        )}
        <button className="action-btn refresh" onClick={loadData}>
          <RefreshCw /> Refresh
        </button>
        <button className="action-btn export" onClick={handleExport}>
          <Download /> Export
        </button>
        <label className="action-btn import">
          <Upload /> Import
          <input type="file" accept=".json" onChange={handleImport} hidden />
        </label>
        {stats && (
          <button className="action-btn reset" onClick={handleResetStats}>
            <BarChart3 /> Reset Stats
          </button>
        )}
      </div>

      {/* Custom Rule Modal */}
      {showCustomRuleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Add Custom Rule</h4>
            <input
              type="text"
              placeholder="Rule name"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="URL pattern (e.g., *ads*.js)"
              value={newRule.pattern}
              onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCustomRuleModal(false)}>
                <X /> Cancel
              </button>
              <button className="primary" onClick={handleAddCustomRule}>
                <Check /> Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Toggle Component
interface FeatureToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  icon,
  label,
  description,
  enabled,
  onChange
}) => {
  return (
    <div className="feature-toggle">
      <div className="feature-info">
        <div className="feature-icon">{icon}</div>
        <div className="feature-text">
          <span className="feature-label">{label}</span>
          <span className="feature-description">{description}</span>
        </div>
      </div>
      <button 
        className={`toggle-switch ${enabled ? 'on' : 'off'}`}
        onClick={onChange}
        title={`${label}: ${enabled ? 'Enabled' : 'Disabled'}`}
        aria-label={`${label}: ${enabled ? 'Enabled' : 'Disabled'}`}
        type="button"
      >
        <span className="toggle-slider" />
      </button>
    </div>
  );
};

export default ShieldPanel;
