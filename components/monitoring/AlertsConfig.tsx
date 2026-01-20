/**
 * AlertsConfig Component
 * 
 * Alert rules management with:
 * - Create/edit/delete alert rules
 * - Multiple trigger types
 * - Multiple notification channels
 * - Test channel functionality
 * - Alert history viewer
 * 
 * @component
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AlertsConfig');

import React, { useState, useEffect, useCallback } from 'react';
import { AlertsService } from '@/lib/services/monitoring-service';
import type { AlertRule, AlertEvent, AlertTrigger, AlertChannel } from '@/lib/services/monitoring-service';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  X
} from 'lucide-react';
import './AlertsConfig.css';

// Toast notification type
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const AlertsConfig: React.FC = () => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [triggerType, setTriggerType] = useState<string>('OnFailure');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [errorPattern, setErrorPattern] = useState('');
  const [cooldownMinutes, setCooldownMinutes] = useState(15);
  
  // Channel state
  const [channelType, setChannelType] = useState<'slack' | 'discord' | 'webhook'>('slack');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const loadData = async () => {
    try {
      const [rulesData, historyData] = await Promise.all([
        AlertsService.getRules(),
        AlertsService.getHistory(50),
      ]);

      setRules(rulesData);
      setHistory(historyData);
      setLoading(false);
    } catch (error) {
      log.error('Failed to load alerts data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async () => {
    try {
      // Build trigger
      let trigger: AlertTrigger;
      switch (triggerType) {
        case 'OnFailure':
          trigger = { OnFailure: null };
          break;
        case 'OnSuccess':
          trigger = { OnSuccess: null };
          break;
        case 'OnDurationExceeds':
          trigger = { OnDurationExceeds: { seconds: durationSeconds } };
          break;
        case 'OnErrorPattern':
          trigger = { OnErrorPattern: { regex: errorPattern } };
          break;
        default:
          trigger = { OnFailure: null };
      }

      // Build channels
      const channels: AlertChannel[] = [];
      if (channelType === 'slack' && slackWebhook) {
        channels.push({ Slack: { webhook_url: slackWebhook } });
      } else if (channelType === 'discord' && discordWebhook) {
        channels.push({ Discord: { webhook_url: discordWebhook } });
      } else if (channelType === 'webhook' && webhookUrl) {
        channels.push({
          Webhook: {
            url: webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
        });
      }

      if (channels.length === 0) {
        showToast('error', 'Please configure at least one notification channel');
        return;
      }

      const rule: AlertRule = {
        id: `alert-${Date.now()}`,
        name: ruleName,
        workflow_id: workflowId || undefined,
        trigger,
        channels,
        enabled: true,
        cooldown_minutes: cooldownMinutes,
      };

      await AlertsService.createRule(rule);
      await loadData();
      setShowCreateModal(false);
      resetForm();
      showToast('success', 'Alert rule created successfully!');
    } catch (error) {
      showToast('error', `Failed to create rule: ${error}`);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await AlertsService.toggleRule(ruleId, enabled);
      await loadData();
      showToast('success', `Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      showToast('error', `Failed to toggle rule: ${error}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this alert rule?')) return;

    try {
      await AlertsService.deleteRule(ruleId);
      await loadData();
      showToast('success', 'Alert rule deleted successfully');
    } catch (error) {
      showToast('error', `Failed to delete rule: ${error}`);
    }
  };

  const handleTestChannel = async () => {
    try {
      let channel: AlertChannel;
      
      if (channelType === 'slack' && slackWebhook) {
        channel = { Slack: { webhook_url: slackWebhook } };
      } else if (channelType === 'discord' && discordWebhook) {
        channel = { Discord: { webhook_url: discordWebhook } };
      } else if (channelType === 'webhook' && webhookUrl) {
        channel = {
          Webhook: {
            url: webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
        };
      } else {
        showToast('error', 'Please configure a channel first');
        return;
      }

      await AlertsService.testChannel(channel);
      showToast('success', 'Test alert sent successfully! Check your channel.');
    } catch (error) {
      showToast('error', `Test failed: ${error}`);
    }
  };

  const resetForm = () => {
    setRuleName('');
    setWorkflowId('');
    setTriggerType('OnFailure');
    setDurationSeconds(60);
    setErrorPattern('');
    setCooldownMinutes(15);
    setSlackWebhook('');
    setDiscordWebhook('');
    setWebhookUrl('');
  };

  const getTriggerDescription = (trigger: AlertTrigger): string => {
    if ('OnFailure' in trigger) return 'On Failure';
    if ('OnSuccess' in trigger) return 'On Success';
    if ('OnDurationExceeds' in trigger) return `Duration > ${trigger.OnDurationExceeds.seconds}s`;
    if ('OnErrorPattern' in trigger) return `Error matches: ${trigger.OnErrorPattern.regex}`;
    if ('OnNodeFailure' in trigger) return `Node failure: ${trigger.OnNodeFailure.node_type}`;
    return 'Unknown';
  };

  const getChannelDescription = (channel: AlertChannel): string => {
    if ('Slack' in channel) return 'Slack';
    if ('Discord' in channel) return 'Discord';
    if ('Webhook' in channel) return 'Custom Webhook';
    return 'Unknown';
  };

  const getSeverityColor = (severity: AlertEvent['severity']): string => {
    switch (severity) {
      case 'Info': return '#3b82f6';
      case 'Warning': return '#f59e0b';
      case 'Error': return '#ef4444';
      case 'Critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="alerts-config loading">Loading alerts...</div>;
  }

  return (
    <div className="alerts-config">
      <div className="alerts-header">
        <h1>
          <Bell className="header-icon" />
          Alert Configuration
        </h1>
        <button onClick={() => setShowCreateModal(true)} className="create-button">
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="rules-section">
        <h2>Alert Rules ({rules.length})</h2>
        {rules.length === 0 ? (
          <div className="empty-state">
            No alert rules configured yet
          </div>
        ) : (
          <div className="rules-list">
            {rules.map((rule) => (
              <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-header">
                  <div className="rule-title">
                    <h3>{rule.name}</h3>
                    {!rule.enabled && <span className="disabled-badge">Disabled</span>}
                  </div>
                  <div className="rule-actions">
                    <button
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                      className="icon-button"
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="icon-button danger"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="rule-details">
                  <div className="rule-detail">
                    <AlertTriangle className="detail-icon" />
                    <span>Trigger: {getTriggerDescription(rule.trigger)}</span>
                  </div>
                  <div className="rule-detail">
                    <Send className="detail-icon" />
                    <span>Channels: {rule.channels.map(getChannelDescription).join(', ')}</span>
                  </div>
                  <div className="rule-detail">
                    <Clock className="detail-icon" />
                    <span>Cooldown: {rule.cooldown_minutes} minutes</span>
                  </div>
                  {rule.workflow_id && (
                    <div className="rule-detail">
                      <Activity className="detail-icon" />
                      <span>Workflow: {rule.workflow_id}</span>
                    </div>
                  )}
                </div>

                {rule.last_triggered && (
                  <div className="last-triggered">
                    Last triggered: {new Date(rule.last_triggered).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert History */}
      <div className="history-section">
        <h2>Alert History ({history.length})</h2>
        {history.length === 0 ? (
          <div className="empty-state">No alerts triggered yet</div>
        ) : (
          <div className="history-list">
            {history.slice(0, 10).map((event) => (
              <div key={event.id} className="history-card">
                <div
                  className="severity-indicator"
                  style={{ background: getSeverityColor(event.severity) }}
                />
                <div className="history-content">
                  <div className="history-header">
                    <span className="workflow-name">{event.workflow_name}</span>
                    <span className="severity-badge" style={{ background: getSeverityColor(event.severity) }}>
                      {event.severity}
                    </span>
                  </div>
                  <div className="history-message">{event.message}</div>
                  <div className="history-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Alert Rule</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-button">×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Rule Name*</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Production Failure Alert"
                />
              </div>

              <div className="form-group">
                <label>Workflow ID (optional)</label>
                <input
                  type="text"
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  placeholder="Leave empty for all workflows"
                />
              </div>

              <div className="form-group">
                <label>Trigger Type*</label>
                <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
                  <option value="OnFailure">On Failure</option>
                  <option value="OnSuccess">On Success</option>
                  <option value="OnDurationExceeds">On Duration Exceeds</option>
                  <option value="OnErrorPattern">On Error Pattern</option>
                </select>
              </div>

              {triggerType === 'OnDurationExceeds' && (
                <div className="form-group">
                  <label>Duration Threshold (seconds)*</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              )}

              {triggerType === 'OnErrorPattern' && (
                <div className="form-group">
                  <label>Error Regex Pattern*</label>
                  <input
                    type="text"
                    value={errorPattern}
                    onChange={(e) => setErrorPattern(e.target.value)}
                    placeholder="timeout|connection.*failed"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Cooldown (minutes)*</label>
                <input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Notification Channel*</label>
                <select value={channelType} onChange={(e) => setChannelType(e.target.value as 'slack' | 'discord' | 'webhook')}>
                  <option value="slack">Slack</option>
                  <option value="discord">Discord</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>

              {channelType === 'slack' && (
                <div className="form-group">
                  <label>Slack Webhook URL*</label>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}

              {channelType === 'discord' && (
                <div className="form-group">
                  <label>Discord Webhook URL*</label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
              )}

              {channelType === 'webhook' && (
                <div className="form-group">
                  <label>Webhook URL*</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={handleTestChannel} className="test-button">
                <Send className="w-4 h-4" />
                Test Channel
              </button>
              <button onClick={() => setShowCreateModal(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleCreateRule} className="create-rule-button">
                <CheckCircle className="w-4 h-4" />
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {toast.type === 'info' && <Bell className="w-4 h-4" />}
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
