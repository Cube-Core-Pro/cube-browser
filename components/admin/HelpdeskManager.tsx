'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Clock, CheckCircle, XCircle,
  RefreshCw, Search, Send, Paperclip, Star,
  MoreVertical, Eye, Edit, Plus,
  TrendingUp, BarChart3,
  MessageCircle, HelpCircle, Book, FileText, Copy,
  AlertCircle, CheckCircle2, Circle, Inbox, FolderOpen as _FolderOpen
} from 'lucide-react';
import {
  HelpdeskService,
  Ticket as _BackendTicket,
  Agent as _BackendAgent,
  CannedResponse as _BackendCannedResponse,
  HelpdeskStats as _BackendHelpdeskStats,
  CreateTicketRequest as _CreateTicketRequest
} from '@/lib/services/admin-service';
import { logger } from '@/lib/services/logger-service';
import './HelpdeskManager.css';

const log = logger.scope('HelpdeskManager');

// ===== Types =====
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  customer: Customer;
  assignee?: Agent;
  tags: string[];
  messages: Message[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  firstResponseAt?: Date;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  satisfaction?: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan: string;
  totalTickets: number;
  avatar?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'agent' | 'admin' | 'supervisor' | 'senior';
  status: 'online' | 'away' | 'offline' | 'busy';
  activeTickets: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  senderAvatar?: string;
  createdAt: Date;
  attachments?: Attachment[];
  isInternal?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  usage: number;
}

interface HelpdeskStats {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedToday: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  slaCompliance: number;
  ticketsByCategory: { category: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  volumeByDay: { date: string; count: number }[];
}

// ===== Component =====
export const HelpdeskManager: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [stats, setStats] = useState<HelpdeskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge' | 'canned' | 'analytics' | 'settings'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, _setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedSelector, setShowCannedSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load data from backend
      const statusParam = filterStatus !== 'all' ? filterStatus : undefined;
      const priorityParam = filterPriority !== 'all' ? filterPriority : undefined;
      const categoryParam = filterCategory !== 'all' ? filterCategory : undefined;
      const searchParam = searchQuery || undefined;

      const [backendTickets, backendAgents, backendCannedResponses, backendStats] = await Promise.all([
        HelpdeskService.getTickets(statusParam, priorityParam, categoryParam, undefined, searchParam),
        HelpdeskService.getAgents(),
        HelpdeskService.getCannedResponses(),
        HelpdeskService.getStats()
      ]);

      // Convert backend types to frontend types
      const convertedTickets: Ticket[] = backendTickets.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        subject: t.subject,
        description: t.description,
        category: t.category === 'feature' ? 'feature_request' : (t.category === 'bug' ? 'bug_report' : t.category) as Ticket['category'],
        priority: t.priority,
        status: t.status === 'in_progress' ? 'open' : (t.status === 'on_hold' ? 'pending' : t.status) as Ticket['status'],
        customer: {
          id: t.customer.id,
          name: t.customer.name,
          email: t.customer.email,
          company: t.customer.company || undefined,
          plan: t.customer.plan,
          totalTickets: t.customer.total_tickets
        },
        assignee: t.assignee ? {
          id: t.assignee.id,
          name: t.assignee.name,
          email: t.assignee.email,
          role: t.assignee.role === 'lead' || t.assignee.role === 'manager' ? 'supervisor' : t.assignee.role,
          status: t.assignee.status,
          activeTickets: t.assignee.active_tickets
        } : undefined,
        tags: t.tags,
        messages: t.messages.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.sender,
          senderName: m.sender_name,
          createdAt: new Date(m.created_at),
          isInternal: m.is_internal
        })),
        attachments: t.attachments.map(a => ({
          id: a.id,
          name: a.name,
          size: a.size,
          type: a.mime_type,
          url: a.url
        })),
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
        firstResponseAt: t.first_response_at ? new Date(t.first_response_at) : undefined,
        resolvedAt: t.resolved_at ? new Date(t.resolved_at) : undefined,
        slaStatus: t.sla_status === 'warning' ? 'at_risk' : t.sla_status
      }));

      const convertedAgents: Agent[] = backendAgents.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role === 'lead' || a.role === 'manager' ? 'supervisor' : a.role,
        status: a.status,
        activeTickets: a.active_tickets
      }));

      const convertedCannedResponses: CannedResponse[] = backendCannedResponses.map(c => ({
        id: c.id,
        title: c.title,
        content: c.content,
        category: c.category,
        usage: c.usage_count
      }));

      const convertedStats: HelpdeskStats = {
        totalTickets: backendStats.total_tickets,
        openTickets: backendStats.open_tickets,
        pendingTickets: backendStats.pending_tickets,
        resolvedToday: backendStats.resolved_today,
        avgResponseTime: backendStats.avg_response_time,
        avgResolutionTime: backendStats.avg_resolution_time,
        satisfactionScore: backendStats.customer_satisfaction,
        slaCompliance: backendStats.sla_compliance,
        ticketsByCategory: Object.entries(backendStats.tickets_by_category).map(([category, count]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          count
        })),
        ticketsByPriority: Object.entries(backendStats.tickets_by_priority).map(([priority, count]) => ({
          priority: priority.charAt(0).toUpperCase() + priority.slice(1),
          count
        })),
        volumeByDay: Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 30) + 10
        }))
      };

      // Mock knowledge articles (would need separate API)
      const mockArticles: KnowledgeArticle[] = [
        { id: '1', title: 'Getting Started with Browser Automation', content: '...', category: 'Getting Started', views: 1250, helpful: 89, notHelpful: 5, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-12-15') },
        { id: '2', title: 'Troubleshooting Connection Issues', content: '...', category: 'Troubleshooting', views: 890, helpful: 67, notHelpful: 8, createdAt: new Date('2025-02-15'), updatedAt: new Date('2025-12-20') },
        { id: '3', title: 'Setting Up Chrome Extension', content: '...', category: 'Installation', views: 2100, helpful: 156, notHelpful: 12, createdAt: new Date('2025-01-10'), updatedAt: new Date('2025-12-25') }
      ];

      setTickets(convertedTickets);
      setAgents(convertedAgents);
      setArticles(mockArticles);
      setCannedResponses(convertedCannedResponses);
      setStats(convertedStats);
    } catch (err) {
      log.error('Failed to load helpdesk data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load helpdesk data');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return 'blue';
      case 'open': return 'yellow';
      case 'pending': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  // Get SLA status color
  const getSlaColor = (sla: string): string => {
    switch (sla) {
      case 'on_track': return 'green';
      case 'at_risk': return 'yellow';
      case 'breached': return 'red';
      default: return 'gray';
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Handle send reply
  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      await HelpdeskService.addReply(
        selectedTicket.id,
        replyMessage,
        'agent_current',
        'Support Agent',
        isInternalNote
      );

      // Refresh ticket data
      await loadData();
      setReplyMessage('');
      setIsInternalNote(false);
    } catch (err) {
      log.error('Failed to send reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    }
  };

  // Handle assign ticket
  const _handleAssignTicket = async (ticketId: string, agentId: string) => {
    try {
      await HelpdeskService.assignTicket(ticketId, agentId);
      await loadData();
    } catch (err) {
      log.error('Failed to assign ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
    }
  };

  // Handle update status
  const _handleUpdateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const backendStatus = newStatus === 'open' ? 'in_progress' : newStatus;
      await HelpdeskService.updateStatus(ticketId, backendStatus as 'open' | 'pending' | 'in_progress' | 'on_hold' | 'resolved' | 'closed');
      await loadData();
    } catch (err) {
      log.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Handle update priority
  const _handleUpdatePriority = async (ticketId: string, newPriority: Ticket['priority']) => {
    try {
      await HelpdeskService.updatePriority(ticketId, newPriority);
      await loadData();
    } catch (err) {
      log.error('Failed to update priority:', err);
      setError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  // Insert canned response
  const insertCannedResponse = (response: CannedResponse) => {
    setReplyMessage(prev => prev + response.content);
    setShowCannedSelector(false);
  };

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return t.subject.toLowerCase().includes(query) ||
             t.ticketNumber.toLowerCase().includes(query) ||
             t.customer.email.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="helpdesk-loading">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span>Loading helpdesk...</span>
      </div>
    );
  }

  return (
    <div className="helpdesk-manager">
      {/* Header */}
      <div className="helpdesk-header">
        <div className="header-title">
          <MessageSquare className="w-6 h-6" />
          <h2>Helpdesk</h2>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px'
        }}>
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)} 
              style={{ marginLeft: '12px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'white' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="helpdesk-stats">
          <div className="stat-card">
            <Inbox className="w-5 h-5 text-blue-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.openTickets}</span>
              <span className="stat-label">Open</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock className="w-5 h-5 text-orange-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.pendingTickets}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.resolvedToday}</span>
              <span className="stat-label">Resolved Today</span>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.avgResponseTime}m</span>
              <span className="stat-label">Avg Response</span>
            </div>
          </div>
          <div className="stat-card">
            <Star className="w-5 h-5 text-yellow-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.satisfactionScore}</span>
              <span className="stat-label">Satisfaction</span>
            </div>
          </div>
          <div className="stat-card">
            <AlertCircle className="w-5 h-5 text-green-500" />
            <div className="stat-info">
              <span className="stat-value">{stats.slaCompliance}%</span>
              <span className="stat-label">SLA Compliance</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="helpdesk-tabs">
        <button 
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <MessageSquare className="w-4 h-4" />
          Tickets
        </button>
        <button 
          className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <Book className="w-4 h-4" />
          Knowledge Base
        </button>
        <button 
          className={`tab ${activeTab === 'canned' ? 'active' : ''}`}
          onClick={() => setActiveTab('canned')}
        >
          <FileText className="w-4 h-4" />
          Canned Responses
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <HelpCircle className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="helpdesk-content">
        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="tickets-section">
            <div className="tickets-layout">
              {/* Tickets List */}
              <div className="tickets-list-panel">
                {/* Filters */}
                <div className="tickets-filters">
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Tickets */}
                <div className="tickets-list">
                  {filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id}
                      className={`ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="ticket-header">
                        <span className="ticket-number">{ticket.ticketNumber}</span>
                        <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="ticket-subject">{ticket.subject}</h4>
                      <div className="ticket-meta">
                        <span className="customer">{ticket.customer.name}</span>
                        <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className="time">{formatTimeAgo(ticket.createdAt)}</span>
                      </div>
                      <div className="ticket-tags">
                        {ticket.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Detail */}
              {selectedTicket ? (
                <div className="ticket-detail-panel">
                  {/* Ticket Header */}
                  <div className="ticket-detail-header">
                    <div className="ticket-info">
                      <span className="ticket-number">{selectedTicket.ticketNumber}</span>
                      <h3>{selectedTicket.subject}</h3>
                    </div>
                    <div className="ticket-actions">
                      <select 
                        value={selectedTicket.status}
                        onChange={(e) => setSelectedTicket(prev => prev ? { ...prev, status: e.target.value as Ticket['status'] } : null)}
                        className="status-select"
                      >
                        <option value="new">New</option>
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button className="btn-icon">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ticket Badges */}
                  <div className="ticket-badges">
                    <span className={`priority-badge ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} priority
                    </span>
                    <span className={`category-badge`}>
                      {selectedTicket.category.replace('_', ' ')}
                    </span>
                    <span className={`sla-badge ${getSlaColor(selectedTicket.slaStatus)}`}>
                      SLA: {selectedTicket.slaStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="customer-info-card">
                    <div className="customer-avatar">
                      {selectedTicket.customer.name.charAt(0)}
                    </div>
                    <div className="customer-details">
                      <span className="name">{selectedTicket.customer.name}</span>
                      <span className="email">{selectedTicket.customer.email}</span>
                      <span className="meta">
                        {selectedTicket.customer.company && <span>{selectedTicket.customer.company}</span>}
                        <span className="plan-badge">{selectedTicket.customer.plan}</span>
                        <span>{selectedTicket.customer.totalTickets} tickets</span>
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="messages-container">
                    {selectedTicket.messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`message ${message.sender} ${message.isInternal ? 'internal' : ''}`}
                      >
                        <div className="message-header">
                          <div className="sender-avatar">
                            {message.senderName.charAt(0)}
                          </div>
                          <span className="sender-name">{message.senderName}</span>
                          {message.isInternal && <span className="internal-badge">Internal Note</span>}
                          <span className="message-time">{formatTimeAgo(message.createdAt)}</span>
                        </div>
                        <div className="message-content">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Box */}
                  <div className="reply-box">
                    <div className="reply-header">
                      <label className="internal-toggle">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                        />
                        <span>Internal Note</span>
                      </label>
                      <button 
                        className="canned-btn"
                        onClick={() => setShowCannedSelector(!showCannedSelector)}
                      >
                        <FileText className="w-4 h-4" />
                        Canned Responses
                      </button>
                    </div>

                    {showCannedSelector && (
                      <div className="canned-selector">
                        {cannedResponses.map(response => (
                          <div 
                            key={response.id}
                            className="canned-item"
                            onClick={() => insertCannedResponse(response)}
                          >
                            <span className="title">{response.title}</span>
                            <span className="category">{response.category}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      placeholder={isInternalNote ? 'Add an internal note...' : 'Type your reply...'}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="reply-actions">
                      <button className="btn-secondary">
                        <Paperclip className="w-4 h-4" />
                        Attach
                      </button>
                      <button className="btn-primary" onClick={handleSendReply}>
                        <Send className="w-4 h-4" />
                        {isInternalNote ? 'Add Note' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-ticket-selected">
                  <MessageCircle className="w-12 h-12" />
                  <span>Select a ticket to view details</span>
                </div>
              )}

              {/* Sidebar */}
              <div className="ticket-sidebar">
                {selectedTicket && (
                  <>
                    {/* Assignee */}
                    <div className="sidebar-section">
                      <h4>Assignee</h4>
                      {selectedTicket.assignee ? (
                        <div className="assignee-card">
                          <div className="assignee-avatar">
                            {selectedTicket.assignee.name.charAt(0)}
                          </div>
                          <div className="assignee-info">
                            <span className="name">{selectedTicket.assignee.name}</span>
                            <span className={`status ${selectedTicket.assignee.status}`}>
                              {selectedTicket.assignee.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <select className="assign-select">
                          <option value="">Assign to...</option>
                          {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.activeTickets} active)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="sidebar-section">
                      <h4>Tags</h4>
                      <div className="tags-list">
                        {selectedTicket.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                            <button className="remove-tag">×</button>
                          </span>
                        ))}
                        <button className="add-tag-btn">+ Add Tag</button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="sidebar-section">
                      <h4>Timeline</h4>
                      <div className="timeline">
                        <div className="timeline-item">
                          <Circle className="w-3 h-3 text-blue-500" />
                          <span>Created</span>
                          <span className="time">{selectedTicket.createdAt.toLocaleString()}</span>
                        </div>
                        {selectedTicket.firstResponseAt && (
                          <div className="timeline-item">
                            <Circle className="w-3 h-3 text-green-500" />
                            <span>First Response</span>
                            <span className="time">{selectedTicket.firstResponseAt.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedTicket.resolvedAt && (
                          <div className="timeline-item">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>Resolved</span>
                            <span className="time">{selectedTicket.resolvedAt.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Related Articles */}
                    <div className="sidebar-section">
                      <h4>Related Articles</h4>
                      <div className="related-articles">
                        {articles.slice(0, 3).map(article => (
                          <a key={article.id} href="#" className="article-link">
                            <Book className="w-4 h-4" />
                            {article.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="knowledge-section">
            <div className="knowledge-header">
              <h3>Knowledge Base Articles</h3>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                New Article
              </button>
            </div>
            <div className="articles-grid">
              {articles.map(article => (
                <div key={article.id} className="article-card">
                  <div className="article-category">{article.category}</div>
                  <h4>{article.title}</h4>
                  <div className="article-stats">
                    <span><Eye className="w-4 h-4" /> {article.views}</span>
                    <span><CheckCircle className="w-4 h-4" /> {article.helpful}</span>
                    <span>Updated: {article.updatedAt.toLocaleDateString()}</span>
                  </div>
                  <div className="article-actions">
                    <button className="btn-secondary">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="btn-secondary">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canned Responses Tab */}
        {activeTab === 'canned' && (
          <div className="canned-section">
            <div className="canned-header">
              <h3>Canned Responses</h3>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                New Response
              </button>
            </div>
            <div className="canned-grid">
              {cannedResponses.map(response => (
                <div key={response.id} className="canned-card">
                  <div className="canned-category">{response.category}</div>
                  <h4>{response.title}</h4>
                  <p className="canned-preview">{response.content.substring(0, 100)}...</p>
                  <div className="canned-stats">
                    <span>Used {response.usage} times</span>
                  </div>
                  <div className="canned-actions">
                    <button className="btn-secondary">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="btn-secondary">
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="analytics-section">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Tickets by Category</h4>
                <div className="category-chart">
                  {stats.ticketsByCategory.map(cat => (
                    <div key={cat.category} className="chart-bar-item">
                      <span className="label">{cat.category}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: `${(cat.count / Math.max(...stats.ticketsByCategory.map(c => c.count))) * 100}%` }}
                        />
                      </div>
                      <span className="count">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <h4>Tickets by Priority</h4>
                <div className="priority-chart">
                  {stats.ticketsByPriority.map(p => (
                    <div key={p.priority} className="chart-bar-item">
                      <span className={`label ${p.priority.toLowerCase()}`}>{p.priority}</span>
                      <div className="bar-container">
                        <div 
                          className={`bar ${p.priority.toLowerCase()}`}
                          style={{ width: `${(p.count / Math.max(...stats.ticketsByPriority.map(x => x.count))) * 100}%` }}
                        />
                      </div>
                      <span className="count">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card wide">
                <h4>Ticket Volume (Last 14 Days)</h4>
                <div className="volume-chart">
                  {stats.volumeByDay.map(d => (
                    <div 
                      key={d.date}
                      className="chart-col"
                      style={{ height: `${(d.count / Math.max(...stats.volumeByDay.map(x => x.count))) * 150}px` }}
                      title={`${d.date}: ${d.count} tickets`}
                    />
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <h4>Performance Metrics</h4>
                <div className="metrics-list">
                  <div className="metric-item">
                    <span className="metric-label">Avg Response Time</span>
                    <span className="metric-value">{stats.avgResponseTime} min</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Avg Resolution Time</span>
                    <span className="metric-value">{Math.floor(stats.avgResolutionTime / 60)}h {stats.avgResolutionTime % 60}m</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Customer Satisfaction</span>
                    <span className="metric-value">{stats.satisfactionScore}/5.0</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">SLA Compliance</span>
                    <span className="metric-value">{stats.slaCompliance}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>SLA Settings</h3>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Response Time (minutes)</label>
                    <input type="number" defaultValue={30} />
                  </div>
                  <div className="form-group">
                    <label>Resolution Time (hours)</label>
                    <input type="number" defaultValue={24} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Urgent Tickets Response (minutes)</label>
                    <input type="number" defaultValue={15} />
                  </div>
                  <div className="form-group">
                    <label>Urgent Tickets Resolution (hours)</label>
                    <input type="number" defaultValue={4} />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>Auto-Assignment</h3>
              <div className="settings-form">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Enable auto-assignment
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Consider agent workload
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Round-robin assignment
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3>Notifications</h3>
              <div className="settings-form">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Email on new ticket
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Slack notification for urgent tickets
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Daily summary report
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpdeskManager;
