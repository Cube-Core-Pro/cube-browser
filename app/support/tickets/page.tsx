'use client';

import React, { useState } from 'react';
import { 
  Ticket,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
  Download,
  Tag,
  Star,
  Send,
  Image,
  X,
  ArrowLeft
} from 'lucide-react';
import './tickets.css';

interface TicketItem {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  messages: number;
  attachments: number;
  tags: string[];
}

interface Message {
  id: string;
  sender: string;
  senderType: 'user' | 'support';
  content: string;
  timestamp: string;
  attachments?: string[];
}

export default function SupportTicketsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

  const tickets: TicketItem[] = [
    {
      id: 'TKT-2026-0142',
      subject: 'Unable to connect to external API',
      description: 'Getting timeout errors when trying to connect to our CRM API...',
      status: 'in-progress',
      priority: 'high',
      category: 'Technical',
      createdAt: '2 hours ago',
      updatedAt: '30 minutes ago',
      assignee: 'Sarah Tech',
      messages: 5,
      attachments: 2,
      tags: ['api', 'integration']
    },
    {
      id: 'TKT-2026-0141',
      subject: 'Billing invoice not showing correct amount',
      description: 'My latest invoice shows incorrect charges...',
      status: 'waiting',
      priority: 'medium',
      category: 'Billing',
      createdAt: '1 day ago',
      updatedAt: '6 hours ago',
      assignee: 'Mike Finance',
      messages: 3,
      attachments: 1,
      tags: ['billing', 'invoice']
    },
    {
      id: 'TKT-2026-0140',
      subject: 'Feature request: Dark mode for reports',
      description: 'It would be great to have dark mode support in the reports section...',
      status: 'open',
      priority: 'low',
      category: 'Feature Request',
      createdAt: '2 days ago',
      updatedAt: '2 days ago',
      messages: 1,
      attachments: 0,
      tags: ['feature', 'ui']
    },
    {
      id: 'TKT-2026-0139',
      subject: 'Automation workflow failing intermittently',
      description: 'Our customer onboarding workflow fails about 20% of the time...',
      status: 'resolved',
      priority: 'urgent',
      category: 'Technical',
      createdAt: '3 days ago',
      updatedAt: '1 day ago',
      assignee: 'Sarah Tech',
      messages: 12,
      attachments: 5,
      tags: ['automation', 'bug']
    },
    {
      id: 'TKT-2026-0138',
      subject: 'Need help setting up SSO',
      description: 'We want to configure SAML SSO for our organization...',
      status: 'closed',
      priority: 'medium',
      category: 'Security',
      createdAt: '5 days ago',
      updatedAt: '3 days ago',
      assignee: 'Security Team',
      messages: 8,
      attachments: 3,
      tags: ['sso', 'enterprise']
    },
    {
      id: 'TKT-2026-0137',
      subject: 'Question about data export formats',
      description: 'What formats are supported for bulk data exports?',
      status: 'resolved',
      priority: 'low',
      category: 'General',
      createdAt: '1 week ago',
      updatedAt: '5 days ago',
      assignee: 'Support Bot',
      messages: 4,
      attachments: 0,
      tags: ['data', 'export']
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      sender: 'You',
      senderType: 'user',
      content: 'Getting timeout errors when trying to connect to our CRM API. The connection was working fine until yesterday.',
      timestamp: '2 hours ago',
      attachments: ['error_log.txt']
    },
    {
      id: '2',
      sender: 'Sarah Tech',
      senderType: 'support',
      content: 'Hi there! I\'m sorry to hear you\'re experiencing connection issues. Let me take a look at your configuration. Could you please share your API endpoint URL (without credentials)?',
      timestamp: '1 hour 45 min ago'
    },
    {
      id: '3',
      sender: 'You',
      senderType: 'user',
      content: 'The endpoint is https://api.ourcrm.com/v2/. We haven\'t made any changes on our end.',
      timestamp: '1 hour 30 min ago'
    },
    {
      id: '4',
      sender: 'Sarah Tech',
      senderType: 'support',
      content: 'Thank you for that information. I\'ve checked our logs and noticed some connectivity issues with that endpoint. It appears their API might be experiencing some latency. I\'ve implemented a retry mechanism for your account. Could you try the connection again?',
      timestamp: '45 min ago',
      attachments: ['retry_config.json']
    },
    {
      id: '5',
      sender: 'You',
      senderType: 'user',
      content: 'That seems to have helped with some requests, but we\'re still seeing occasional timeouts. Is there a way to increase the timeout threshold?',
      timestamp: '30 min ago'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in-progress': return <RefreshCw size={14} />;
      case 'waiting': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'closed': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'open' && ['open', 'in-progress', 'waiting'].includes(ticket.status)) ||
      (activeTab === 'resolved' && ['resolved', 'closed'].includes(ticket.status));
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesPriority && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['open', 'in-progress', 'waiting'].includes(t.status)).length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    avgResponse: '2.5h'
  };

  return (
    <div className="support-tickets">
      {!selectedTicket ? (
        <>
          <header className="support-tickets__header">
            <div className="support-tickets__title-section">
              <div className="support-tickets__icon">
                <Ticket size={28} />
              </div>
              <div>
                <h1>Support Tickets</h1>
                <p>Manage your support requests and track their progress</p>
              </div>
            </div>
            <button 
              className="new-ticket-btn"
              onClick={() => setShowNewTicketModal(true)}
            >
              <Plus size={18} />
              New Ticket
            </button>
          </header>

          <div className="support-tickets__stats">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value open">{stats.open}</div>
              <div className="stat-label">Open</div>
            </div>
            <div className="stat-card">
              <div className="stat-value resolved">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgResponse}</div>
              <div className="stat-label">Avg Response</div>
            </div>
          </div>

          <div className="support-tickets__filters">
            <nav className="tabs">
              {[
                { id: 'all', label: 'All Tickets' },
                { id: 'open', label: 'Open' },
                { id: 'resolved', label: 'Resolved' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            <div className="filter-controls">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="priority-filter">
                <Filter size={16} />
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="support-tickets__list">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                className="ticket-card"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <div className="ticket-id">{ticket.id}</div>
                  <span className={`priority-badge ${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </div>
                
                <h3 className="ticket-subject">{ticket.subject}</h3>
                <p className="ticket-description">{ticket.description}</p>
                
                <div className="ticket-meta">
                  <span className={`status-badge ${ticket.status}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('-', ' ')}
                  </span>
                  <span className="category-badge">{ticket.category}</span>
                  <span className="ticket-time">
                    <Clock size={14} />
                    Updated {ticket.updatedAt}
                  </span>
                </div>
                
                <div className="ticket-footer">
                  <div className="ticket-tags">
                    {ticket.tags.map(tag => (
                      <span key={tag} className="tag">
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="ticket-indicators">
                    <span className="indicator">
                      <MessageSquare size={14} />
                      {ticket.messages}
                    </span>
                    {ticket.attachments > 0 && (
                      <span className="indicator">
                        <Paperclip size={14} />
                        {ticket.attachments}
                      </span>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="ticket-arrow" size={20} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="ticket-detail">
          <header className="ticket-detail__header">
            <button 
              className="back-btn"
              onClick={() => setSelectedTicket(null)}
            >
              <ArrowLeft size={18} />
              Back to Tickets
            </button>
            <div className="ticket-detail__actions">
              <span className={`status-badge ${selectedTicket.status}`}>
                {getStatusIcon(selectedTicket.status)}
                {selectedTicket.status.replace('-', ' ')}
              </span>
              <span className={`priority-badge ${selectedTicket.priority}`}>
                {selectedTicket.priority}
              </span>
              <button className="action-btn">
                <MoreVertical size={18} />
              </button>
            </div>
          </header>

          <div className="ticket-detail__content">
            <div className="ticket-info">
              <div className="ticket-info__header">
                <div className="ticket-info__id">{selectedTicket.id}</div>
                <h2>{selectedTicket.subject}</h2>
              </div>
              
              <div className="ticket-info__meta">
                <div className="meta-item">
                  <span className="meta-label">Category</span>
                  <span className="meta-value">{selectedTicket.category}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{selectedTicket.createdAt}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-value">{selectedTicket.updatedAt}</span>
                </div>
                {selectedTicket.assignee && (
                  <div className="meta-item">
                    <span className="meta-label">Assignee</span>
                    <span className="meta-value assignee">
                      <div className="assignee-avatar">
                        {selectedTicket.assignee.charAt(0)}
                      </div>
                      {selectedTicket.assignee}
                    </span>
                  </div>
                )}
              </div>

              <div className="ticket-tags-section">
                <span className="meta-label">Tags</span>
                <div className="tags-list">
                  {selectedTicket.tags.map(tag => (
                    <span key={tag} className="tag">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ticket-conversation">
              <h3>Conversation</h3>
              
              <div className="messages-list">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.senderType}`}
                  >
                    <div className="message-avatar">
                      {message.sender.charAt(0)}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">{message.sender}</span>
                        <span className="message-time">{message.timestamp}</span>
                      </div>
                      <p className="message-text">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map((file, idx) => (
                            <span key={idx} className="attachment">
                              <Paperclip size={12} />
                              {file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="reply-box">
                <div className="reply-input">
                  <textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="reply-actions">
                    <div className="reply-attachments">
                      <button className="attach-btn">
                        <Paperclip size={18} />
                      </button>
                      <button className="attach-btn">
                        <Image size={18} />
                      </button>
                    </div>
                    <button className="send-btn">
                      <Send size={18} />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewTicketModal && (
        <div className="modal-overlay" onClick={() => setShowNewTicketModal(false)}>
          <div className="modal new-ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Ticket</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewTicketModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select>
                    <option>Technical</option>
                    <option>Billing</option>
                    <option>Security</option>
                    <option>Feature Request</option>
                    <option>General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  placeholder="Provide as much detail as possible..."
                  rows={5}
                />
              </div>
              
              <div className="form-group">
                <label>Attachments</label>
                <div className="file-upload">
                  <Paperclip size={20} />
                  <span>Drop files here or click to upload</span>
                  <span className="file-hint">Max 10MB per file</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowNewTicketModal(false)}
              >
                Cancel
              </button>
              <button className="submit-btn">
                <Send size={16} />
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
