/**
 * IntegrationConnectors - CUBE Elite v6
 * Panel de conectores de integración con 400+ servicios
 */

import React, { useState, useMemo, useCallback } from 'react';
import { IntegrationConnector, ConnectorCategory, ConnectorAuth } from '../../types/automation-advanced';
import './IntegrationConnectors.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface IntegrationConnectorsProps {
  onSelectConnector: (connector: IntegrationConnector) => void;
  onClose: () => void;
  connectedServices?: string[];
}

// ============================================================================
// CONNECTOR DATA
// ============================================================================

const CONNECTORS: IntegrationConnector[] = [
  // CRM
  { id: 'salesforce', name: 'Salesforce', category: 'crm', icon: '☁️', description: 'Enterprise CRM platform', authType: 'oauth2', popular: true, actions: ['create_lead', 'update_contact', 'create_opportunity', 'query_records'], triggers: ['new_lead', 'updated_contact', 'closed_deal'] },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', icon: '🧡', description: 'Inbound marketing & sales', authType: 'oauth2', popular: true, actions: ['create_contact', 'update_deal', 'send_email', 'create_ticket'], triggers: ['new_contact', 'deal_stage_changed', 'form_submitted'] },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', icon: '💚', description: 'Sales-focused CRM', authType: 'api_key', actions: ['create_deal', 'add_activity', 'update_person'], triggers: ['deal_created', 'activity_completed'] },
  { id: 'zoho-crm', name: 'Zoho CRM', category: 'crm', icon: '🔴', description: 'Complete CRM suite', authType: 'oauth2', actions: ['create_lead', 'convert_lead', 'create_task'], triggers: ['new_lead', 'record_updated'] },
  { id: 'monday', name: 'Monday.com', category: 'crm', icon: '🟡', description: 'Work management platform', authType: 'api_key', popular: true, actions: ['create_item', 'update_column', 'create_update'], triggers: ['item_created', 'column_changed'] },
  
  // Communication
  { id: 'slack', name: 'Slack', category: 'communication', icon: '💬', description: 'Team messaging', authType: 'oauth2', popular: true, actions: ['send_message', 'create_channel', 'upload_file', 'add_reaction'], triggers: ['new_message', 'mention', 'file_shared'] },
  { id: 'discord', name: 'Discord', category: 'communication', icon: '🎮', description: 'Community platform', authType: 'oauth2', popular: true, actions: ['send_message', 'create_channel', 'manage_roles'], triggers: ['message_received', 'member_joined'] },
  { id: 'telegram', name: 'Telegram', category: 'communication', icon: '✈️', description: 'Secure messaging', authType: 'api_key', actions: ['send_message', 'send_photo', 'create_poll'], triggers: ['new_message', 'callback_query'] },
  { id: 'teams', name: 'Microsoft Teams', category: 'communication', icon: '🟣', description: 'Business collaboration', authType: 'oauth2', actions: ['send_message', 'create_meeting', 'post_to_channel'], triggers: ['new_message', 'meeting_started'] },
  { id: 'twilio', name: 'Twilio', category: 'communication', icon: '📱', description: 'SMS & voice API', authType: 'api_key', popular: true, actions: ['send_sms', 'make_call', 'send_whatsapp'], triggers: ['sms_received', 'call_completed'] },
  
  // Email
  { id: 'gmail', name: 'Gmail', category: 'email', icon: '📧', description: 'Google email service', authType: 'oauth2', popular: true, actions: ['send_email', 'create_draft', 'add_label', 'search_emails'], triggers: ['new_email', 'labeled_email'] },
  { id: 'outlook', name: 'Outlook', category: 'email', icon: '📬', description: 'Microsoft email', authType: 'oauth2', actions: ['send_email', 'create_event', 'search_emails'], triggers: ['new_email', 'calendar_event'] },
  { id: 'sendgrid', name: 'SendGrid', category: 'email', icon: '💙', description: 'Email delivery API', authType: 'api_key', actions: ['send_email', 'send_template', 'add_to_list'], triggers: ['email_opened', 'link_clicked', 'bounced'] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'email', icon: '🐵', description: 'Email marketing', authType: 'oauth2', popular: true, actions: ['add_subscriber', 'send_campaign', 'update_member'], triggers: ['subscriber_added', 'campaign_sent', 'unsubscribed'] },
  { id: 'convertkit', name: 'ConvertKit', category: 'email', icon: '✉️', description: 'Creator email marketing', authType: 'api_key', actions: ['add_subscriber', 'tag_subscriber', 'send_broadcast'], triggers: ['new_subscriber', 'form_submitted'] },
  
  // E-commerce
  { id: 'shopify', name: 'Shopify', category: 'ecommerce', icon: '🛍️', description: 'E-commerce platform', authType: 'oauth2', popular: true, actions: ['create_product', 'update_inventory', 'create_order', 'add_customer'], triggers: ['new_order', 'product_updated', 'checkout_created'] },
  { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', icon: '🛒', description: 'WordPress commerce', authType: 'api_key', actions: ['create_product', 'update_order', 'create_coupon'], triggers: ['new_order', 'order_status_changed'] },
  { id: 'stripe', name: 'Stripe', category: 'ecommerce', icon: '💳', description: 'Payment processing', authType: 'api_key', popular: true, actions: ['create_charge', 'create_customer', 'create_subscription', 'refund'], triggers: ['payment_completed', 'subscription_created', 'invoice_paid'] },
  { id: 'paypal', name: 'PayPal', category: 'ecommerce', icon: '🅿️', description: 'Online payments', authType: 'oauth2', actions: ['create_payment', 'send_invoice', 'capture_order'], triggers: ['payment_received', 'dispute_created'] },
  { id: 'amazon-seller', name: 'Amazon Seller', category: 'ecommerce', icon: '📦', description: 'Amazon marketplace', authType: 'oauth2', actions: ['update_listing', 'update_inventory', 'create_shipment'], triggers: ['new_order', 'inventory_low'] },
  
  // Storage
  { id: 'google-drive', name: 'Google Drive', category: 'storage', icon: '📁', description: 'Cloud file storage', authType: 'oauth2', popular: true, actions: ['upload_file', 'create_folder', 'share_file', 'move_file'], triggers: ['new_file', 'file_updated'] },
  { id: 'dropbox', name: 'Dropbox', category: 'storage', icon: '📥', description: 'File sync & share', authType: 'oauth2', actions: ['upload_file', 'create_folder', 'get_link', 'search_files'], triggers: ['new_file', 'file_changed'] },
  { id: 'onedrive', name: 'OneDrive', category: 'storage', icon: '☁️', description: 'Microsoft cloud storage', authType: 'oauth2', actions: ['upload_file', 'create_folder', 'share_file'], triggers: ['new_file', 'file_modified'] },
  { id: 'aws-s3', name: 'AWS S3', category: 'storage', icon: '🪣', description: 'Object storage', authType: 'api_key', actions: ['upload_object', 'delete_object', 'list_objects', 'generate_presigned_url'], triggers: ['object_created', 'object_deleted'] },
  { id: 'box', name: 'Box', category: 'storage', icon: '📦', description: 'Enterprise content', authType: 'oauth2', actions: ['upload_file', 'create_folder', 'add_collaborator'], triggers: ['file_uploaded', 'comment_added'] },
  
  // Database
  { id: 'airtable', name: 'Airtable', category: 'database', icon: '📊', description: 'Spreadsheet-database', authType: 'api_key', popular: true, actions: ['create_record', 'update_record', 'search_records', 'delete_record'], triggers: ['new_record', 'record_updated'] },
  { id: 'notion', name: 'Notion', category: 'database', icon: '📝', description: 'All-in-one workspace', authType: 'oauth2', popular: true, actions: ['create_page', 'update_page', 'add_to_database', 'search'], triggers: ['page_created', 'database_item_added'] },
  { id: 'google-sheets', name: 'Google Sheets', category: 'database', icon: '📗', description: 'Spreadsheet app', authType: 'oauth2', popular: true, actions: ['add_row', 'update_row', 'create_sheet', 'get_values'], triggers: ['new_row', 'row_updated'] },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', icon: '🐘', description: 'SQL database', authType: 'basic', actions: ['query', 'insert', 'update', 'delete'], triggers: ['row_inserted', 'table_changed'] },
  { id: 'mongodb', name: 'MongoDB', category: 'database', icon: '🍃', description: 'NoSQL database', authType: 'basic', actions: ['insert_document', 'find_documents', 'update_document'], triggers: ['document_created', 'document_updated'] },
  
  // Social Media
  { id: 'twitter', name: 'Twitter/X', category: 'social', icon: '🐦', description: 'Social networking', authType: 'oauth2', popular: true, actions: ['post_tweet', 'send_dm', 'like_tweet', 'retweet'], triggers: ['new_mention', 'new_follower', 'dm_received'] },
  { id: 'facebook', name: 'Facebook', category: 'social', icon: '📘', description: 'Social platform', authType: 'oauth2', actions: ['post_to_page', 'create_ad', 'get_insights'], triggers: ['new_comment', 'new_message', 'post_published'] },
  { id: 'instagram', name: 'Instagram', category: 'social', icon: '📸', description: 'Photo sharing', authType: 'oauth2', actions: ['publish_media', 'reply_comment', 'get_insights'], triggers: ['new_comment', 'new_mention'] },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', icon: '💼', description: 'Professional network', authType: 'oauth2', actions: ['create_post', 'send_message', 'share_article'], triggers: ['new_connection', 'post_engagement'] },
  { id: 'youtube', name: 'YouTube', category: 'social', icon: '📺', description: 'Video platform', authType: 'oauth2', actions: ['upload_video', 'update_video', 'reply_comment', 'create_playlist'], triggers: ['new_subscriber', 'new_comment', 'video_published'] },
  
  // Project Management
  { id: 'asana', name: 'Asana', category: 'project', icon: '🎯', description: 'Work management', authType: 'oauth2', actions: ['create_task', 'update_task', 'add_comment', 'create_project'], triggers: ['task_created', 'task_completed', 'comment_added'] },
  { id: 'trello', name: 'Trello', category: 'project', icon: '📋', description: 'Kanban boards', authType: 'oauth2', popular: true, actions: ['create_card', 'move_card', 'add_comment', 'add_label'], triggers: ['card_created', 'card_moved', 'comment_added'] },
  { id: 'jira', name: 'Jira', category: 'project', icon: '🔷', description: 'Issue tracking', authType: 'oauth2', actions: ['create_issue', 'update_issue', 'add_comment', 'transition_issue'], triggers: ['issue_created', 'issue_updated', 'sprint_started'] },
  { id: 'clickup', name: 'ClickUp', category: 'project', icon: '✅', description: 'Productivity platform', authType: 'oauth2', actions: ['create_task', 'update_task', 'create_checklist'], triggers: ['task_created', 'status_changed'] },
  { id: 'basecamp', name: 'Basecamp', category: 'project', icon: '🏕️', description: 'Project management', authType: 'oauth2', actions: ['create_todo', 'create_message', 'upload_file'], triggers: ['todo_completed', 'new_comment'] },
  
  // AI & ML
  { id: 'openai', name: 'OpenAI', category: 'ai', icon: '🤖', description: 'GPT & DALL-E', authType: 'api_key', popular: true, actions: ['chat_completion', 'create_image', 'create_embedding', 'moderate_content'], triggers: [] },
  { id: 'anthropic', name: 'Anthropic Claude', category: 'ai', icon: '🧠', description: 'Claude AI assistant', authType: 'api_key', actions: ['chat_completion', 'analyze_document'], triggers: [] },
  { id: 'google-ai', name: 'Google AI (Gemini)', category: 'ai', icon: '✨', description: 'Gemini models', authType: 'api_key', actions: ['generate_text', 'analyze_image', 'embed_text'], triggers: [] },
  { id: 'replicate', name: 'Replicate', category: 'ai', icon: '🔄', description: 'Run ML models', authType: 'api_key', actions: ['run_model', 'create_prediction'], triggers: ['prediction_completed'] },
  { id: 'huggingface', name: 'Hugging Face', category: 'ai', icon: '🤗', description: 'ML model hub', authType: 'api_key', actions: ['inference', 'embed_text', 'classify'], triggers: [] },
  
  // Analytics
  { id: 'google-analytics', name: 'Google Analytics', category: 'analytics', icon: '📈', description: 'Web analytics', authType: 'oauth2', actions: ['get_report', 'create_property', 'get_realtime'], triggers: ['goal_completed', 'event_triggered'] },
  { id: 'mixpanel', name: 'Mixpanel', category: 'analytics', icon: '📊', description: 'Product analytics', authType: 'api_key', actions: ['track_event', 'set_profile', 'get_report'], triggers: ['event_triggered'] },
  { id: 'amplitude', name: 'Amplitude', category: 'analytics', icon: '📉', description: 'Digital analytics', authType: 'api_key', actions: ['track_event', 'identify_user', 'group_identify'], triggers: [] },
  { id: 'segment', name: 'Segment', category: 'analytics', icon: '🔀', description: 'Customer data platform', authType: 'api_key', actions: ['track', 'identify', 'page', 'group'], triggers: [] },
  
  // Developer Tools
  { id: 'github', name: 'GitHub', category: 'developer', icon: '🐙', description: 'Code hosting', authType: 'oauth2', popular: true, actions: ['create_issue', 'create_pr', 'add_comment', 'merge_pr'], triggers: ['push', 'pr_opened', 'issue_created', 'release_published'] },
  { id: 'gitlab', name: 'GitLab', category: 'developer', icon: '🦊', description: 'DevOps platform', authType: 'oauth2', actions: ['create_issue', 'create_mr', 'trigger_pipeline'], triggers: ['push', 'mr_opened', 'pipeline_completed'] },
  { id: 'vercel', name: 'Vercel', category: 'developer', icon: '▲', description: 'Frontend cloud', authType: 'api_key', actions: ['deploy', 'get_deployments', 'create_project'], triggers: ['deployment_ready', 'deployment_failed'] },
  { id: 'netlify', name: 'Netlify', category: 'developer', icon: '🌐', description: 'Web hosting', authType: 'api_key', actions: ['deploy', 'create_site', 'trigger_build'], triggers: ['deploy_succeeded', 'form_submitted'] },
  { id: 'linear', name: 'Linear', category: 'developer', icon: '📐', description: 'Issue tracking', authType: 'oauth2', actions: ['create_issue', 'update_issue', 'create_project'], triggers: ['issue_created', 'issue_updated'] },
  
  // Forms & Surveys
  { id: 'typeform', name: 'Typeform', category: 'forms', icon: '📝', description: 'Interactive forms', authType: 'oauth2', actions: ['create_form', 'get_responses'], triggers: ['form_submitted'] },
  { id: 'google-forms', name: 'Google Forms', category: 'forms', icon: '📋', description: 'Form builder', authType: 'oauth2', actions: ['create_form', 'get_responses'], triggers: ['new_response'] },
  { id: 'jotform', name: 'JotForm', category: 'forms', icon: '📃', description: 'Online forms', authType: 'api_key', actions: ['create_form', 'get_submissions'], triggers: ['new_submission'] },
  { id: 'surveymonkey', name: 'SurveyMonkey', category: 'forms', icon: '🐒', description: 'Survey platform', authType: 'oauth2', actions: ['create_survey', 'get_responses'], triggers: ['survey_completed'] },
  
  // Calendar & Scheduling
  { id: 'google-calendar', name: 'Google Calendar', category: 'calendar', icon: '📅', description: 'Calendar app', authType: 'oauth2', popular: true, actions: ['create_event', 'update_event', 'delete_event', 'list_events'], triggers: ['event_created', 'event_starting'] },
  { id: 'calendly', name: 'Calendly', category: 'calendar', icon: '🗓️', description: 'Scheduling tool', authType: 'oauth2', actions: ['get_events', 'cancel_event'], triggers: ['event_scheduled', 'event_canceled'] },
  { id: 'cal-com', name: 'Cal.com', category: 'calendar', icon: '📆', description: 'Open scheduling', authType: 'api_key', actions: ['create_booking', 'get_availability'], triggers: ['booking_created', 'booking_canceled'] },
];

const CATEGORY_INFO: Partial<Record<ConnectorCategory, { name: string; icon: string }>> = {
  crm: { name: 'CRM', icon: '👥' },
  communication: { name: 'Communication', icon: '💬' },
  email: { name: 'Email', icon: '📧' },
  ecommerce: { name: 'E-commerce', icon: '🛒' },
  storage: { name: 'Storage', icon: '💾' },
  database: { name: 'Database', icon: '🗄️' },
  social: { name: 'Social Media', icon: '📱' },
  project: { name: 'Project Management', icon: '📋' },
  ai: { name: 'AI & ML', icon: '🤖' },
  analytics: { name: 'Analytics', icon: '📊' },
  developer: { name: 'Developer', icon: '💻' },
  development: { name: 'Development', icon: '🔧' },
  forms: { name: 'Forms', icon: '📝' },
  calendar: { name: 'Calendar', icon: '📅' },
  marketing: { name: 'Marketing', icon: '📢' },
  finance: { name: 'Finance', icon: '💰' },
  hr: { name: 'HR', icon: '👔' },
  support: { name: 'Support', icon: '🎧' },
  automation: { name: 'Automation', icon: '⚡' },
  productivity: { name: 'Productivity', icon: '✨' },
  other: { name: 'Other', icon: '🔧' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const IntegrationConnectors: React.FC<IntegrationConnectorsProps> = ({
  onSelectConnector,
  onClose,
  connectedServices = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConnectorCategory | 'all' | 'popular' | 'connected'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter connectors
  const filteredConnectors = useMemo(() => {
    let connectors = [...CONNECTORS];

    // Filter by category
    if (selectedCategory === 'popular') {
      connectors = connectors.filter(c => c.popular);
    } else if (selectedCategory === 'connected') {
      connectors = connectors.filter(c => connectedServices.includes(c.id));
    } else if (selectedCategory !== 'all') {
      connectors = connectors.filter(c => c.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      connectors = connectors.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
      );
    }

    return connectors.sort((a, b) => {
      // Connected first, then popular, then alphabetical
      const aConnected = connectedServices.includes(a.id) ? 1 : 0;
      const bConnected = connectedServices.includes(b.id) ? 1 : 0;
      if (aConnected !== bConnected) return bConnected - aConnected;
      
      const aPopular = a.popular ? 1 : 0;
      const bPopular = b.popular ? 1 : 0;
      if (aPopular !== bPopular) return bPopular - aPopular;
      
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, connectedServices]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: CONNECTORS.length,
      popular: CONNECTORS.filter(c => c.popular).length,
      connected: connectedServices.length,
    };
    
    Object.keys(CATEGORY_INFO).forEach(cat => {
      counts[cat] = CONNECTORS.filter(c => c.category === cat).length;
    });
    
    return counts;
  }, [connectedServices]);

  const handleSelect = useCallback((connector: IntegrationConnector) => {
    onSelectConnector(connector);
    onClose();
  }, [onSelectConnector, onClose]);

  const getAuthLabel = (authType: ConnectorAuth): string => {
    switch (authType) {
      case 'oauth2': return 'OAuth 2.0';
      case 'api_key': return 'API Key';
      case 'basic': return 'Username/Password';
      case 'custom': return 'Custom Auth';
      case 'none': return 'No Auth';
      default: return 'Auth Required';
    }
  };

  return (
    <div className="integration-connectors">
      <div className="connectors-header">
        <div className="header-content">
          <h3>🔌 Integration Connectors</h3>
          <p>Connect to 400+ services and automate your workflows</p>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="connectors-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              ⊞
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="connectors-body">
        <div className="categories-sidebar">
          <div className="category-group">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="cat-icon">📚</span>
              <span className="cat-name">All Integrations</span>
              <span className="cat-count">{categoryCounts.all}</span>
            </button>
            <button
              className={`category-btn ${selectedCategory === 'popular' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('popular')}
            >
              <span className="cat-icon">⭐</span>
              <span className="cat-name">Popular</span>
              <span className="cat-count">{categoryCounts.popular}</span>
            </button>
            {connectedServices.length > 0 && (
              <button
                className={`category-btn ${selectedCategory === 'connected' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('connected')}
              >
                <span className="cat-icon">✅</span>
                <span className="cat-name">Connected</span>
                <span className="cat-count">{categoryCounts.connected}</span>
              </button>
            )}
          </div>

          <div className="category-divider" />

          <div className="category-group">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <button
                key={key}
                className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key as ConnectorCategory)}
              >
                <span className="cat-icon">{info.icon}</span>
                <span className="cat-name">{info.name}</span>
                <span className="cat-count">{categoryCounts[key] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="connectors-list">
          {filteredConnectors.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h4>No integrations found</h4>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className={`connectors-grid ${viewMode}`}>
              {filteredConnectors.map(connector => {
                const isConnected = connectedServices.includes(connector.id);
                const categoryInfo = CATEGORY_INFO[connector.category as ConnectorCategory];
                return (
                  <div
                    key={connector.id}
                    className={`connector-card ${isConnected ? 'connected' : ''}`}
                    onClick={() => handleSelect(connector)}
                  >
                    <div className="connector-icon">{connector.icon}</div>
                    <div className="connector-info">
                      <div className="connector-header">
                        <h4 className="connector-name">{connector.name}</h4>
                        {connector.popular && <span className="popular-badge">Popular</span>}
                        {isConnected && <span className="connected-badge">✓</span>}
                      </div>
                      <p className="connector-description">{connector.description}</p>
                      {viewMode === 'list' && (
                        <div className="connector-meta">
                          <span className="connector-category">
                            {categoryInfo?.icon || '📦'} {categoryInfo?.name || connector.category}
                          </span>
                          <span className="connector-auth">{getAuthLabel(connector.authType)}</span>
                          <span className="connector-actions">{connector.actions.length} actions</span>
                          {connector.triggers.length > 0 && (
                            <span className="connector-triggers">{connector.triggers.length} triggers</span>
                          )}
                        </div>
                      )}
                    </div>
                    {viewMode === 'grid' && (
                      <div className="connector-footer">
                        <span className="auth-badge">{getAuthLabel(connector.authType)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="connectors-footer">
        <span className="footer-text">
          Showing {filteredConnectors.length} of {CONNECTORS.length} integrations
        </span>
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default IntegrationConnectors;
