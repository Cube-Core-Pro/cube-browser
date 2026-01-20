'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Plus, Clock, CheckCircle2,
  AlertCircle, ChevronRight, User, Mail, Phone,
  Tag, Filter, ArrowUpDown, Send, Paperclip, X
} from 'lucide-react';
import './support.css';

// ============================================
// Types
// ============================================

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: 'client' | 'support';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: string;
}

// ============================================
// Data
// ============================================

const CATEGORIES = [
  'Technical Issue',
  'Billing Question',
  'Feature Request',
  'Account Access',
  'Integration Help',
  'General Inquiry'
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Unable to connect custom domain',
    description: 'Getting DNS verification error when trying to add our custom domain',
    status: 'open',
    priority: 'high',
    category: 'Technical Issue',
    client: {
      id: 'CLT-001',
      name: 'John Smith',
      email: 'john@acmecorp.com',
      company: 'Acme Corp'
    },
    createdAt: '2026-01-08T10:30:00Z',
    updatedAt: '2026-01-08T10:30:00Z',
    messages: [
      {
        id: 'MSG-001',
        sender: 'client',
        senderName: 'John Smith',
        content: 'We\'ve added the TXT record but verification keeps failing. DNS propagation should be complete by now.',
        timestamp: '2026-01-08T10:30:00Z'
      }
    ]
  },
  {
    id: 'TKT-002',
    subject: 'Branding not showing on client portal',
    description: 'Custom logo and colors not appearing for end users',
    status: 'in-progress',
    priority: 'medium',
    category: 'Technical Issue',
    client: {
      id: 'CLT-002',
      name: 'Sarah Johnson',
      email: 'sarah@techstart.io',
      company: 'TechStart'
    },
    assignee: 'Support Agent',
    createdAt: '2026-01-07T15:45:00Z',
    updatedAt: '2026-01-08T09:00:00Z',
    messages: [
      {
        id: 'MSG-002',
        sender: 'client',
        senderName: 'Sarah Johnson',
        content: 'I uploaded our logo and set custom colors yesterday but they\'re not showing up.',
        timestamp: '2026-01-07T15:45:00Z'
      },
      {
        id: 'MSG-003',
        sender: 'support',
        senderName: 'Support Agent',
        content: 'Thanks for reaching out! I\'m looking into this. Have you tried clearing your browser cache?',
        timestamp: '2026-01-08T09:00:00Z'
      }
    ]
  },
  {
    id: 'TKT-003',
    subject: 'Question about billing for additional users',
    description: 'Need clarification on pricing for adding more seats',
    status: 'resolved',
    priority: 'low',
    category: 'Billing Question',
    client: {
      id: 'CLT-003',
      name: 'Mike Chen',
      email: 'mike@growthco.com',
      company: 'GrowthCo'
    },
    assignee: 'Support Agent',
    createdAt: '2026-01-06T11:20:00Z',
    updatedAt: '2026-01-07T14:30:00Z',
    messages: []
  }
];

// ============================================
// Helper Functions
// ============================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================
// Main Component
// ============================================

export default function WhiteLabelSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [stats, setStats] = useState<TicketStats>({
    total: 15,
    open: 4,
    inProgress: 3,
    resolved: 8,
    avgResponseTime: '2.5h'
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'closed': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    const message: TicketMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'support',
      senderName: 'You',
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, message],
      updatedAt: new Date().toISOString()
    };
    
    setSelectedTicket(updatedTicket);
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setNewMessage('');
  };

  return (
    <div className="support-page">
      {/* Header */}
      <header className="support-header">
        <div className="header-content">
          <div className="header-title">
            <MessageSquare className="w-8 h-8" />
            <div>
              <h1>Client Support</h1>
              <p>Manage support tickets from your white-label clients</p>
            </div>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowNewTicketModal(true)}
          >
            <Plus className="w-5 h-5" /> New Ticket
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
          <div className="stat-card open">
            <span className="stat-value">{stats.open}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-card progress">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card resolved">
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.avgResponseTime}</span>
            <span className="stat-label">Avg Response</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="support-content">
        {/* Tickets List */}
        <div className="tickets-panel">
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
            <div className="filter-group">
              <Filter className="w-4 h-4" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Tickets */}
          <div className="tickets-list">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <span className="ticket-id">{ticket.id}</span>
                  <span className={`ticket-priority ${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </div>
                <h3 className="ticket-subject">{ticket.subject}</h3>
                <div className="ticket-meta">
                  <span className="ticket-client">
                    <User className="w-3 h-3" />
                    {ticket.client.name}
                  </span>
                  <span className={`ticket-status ${ticket.status}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="ticket-footer">
                  <span className="ticket-category">
                    <Tag className="w-3 h-3" />
                    {ticket.category}
                  </span>
                  <span className="ticket-time">{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>
            ))}
            
            {filteredTickets.length === 0 && (
              <div className="empty-tickets">
                <MessageSquare className="w-10 h-10" />
                <h3>No tickets found</h3>
                <p>Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="ticket-detail">
          {selectedTicket ? (
            <>
              <div className="detail-header">
                <div className="detail-title">
                  <span className="detail-id">{selectedTicket.id}</span>
                  <h2>{selectedTicket.subject}</h2>
                </div>
                <div className="detail-actions">
                  <select 
                    className="status-select"
                    value={selectedTicket.status}
                    onChange={(e) => {
                      const updated = { ...selectedTicket, status: e.target.value as Ticket['status'] };
                      setSelectedTicket(updated);
                      setTickets(tickets.map(t => t.id === updated.id ? updated : t));
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="client-info">
                <div className="client-avatar">
                  {selectedTicket.client.name.charAt(0)}
                </div>
                <div className="client-details">
                  <h4>{selectedTicket.client.name}</h4>
                  <p>{selectedTicket.client.company}</p>
                </div>
                <div className="client-contact">
                  <a href={`mailto:${selectedTicket.client.email}`}>
                    <Mail className="w-4 h-4" />
                    {selectedTicket.client.email}
                  </a>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="ticket-info-grid">
                <div className="info-item">
                  <span className="info-label">Category</span>
                  <span className="info-value">{selectedTicket.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Priority</span>
                  <span className={`info-value priority ${selectedTicket.priority}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatFullDate(selectedTicket.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatFullDate(selectedTicket.updatedAt)}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-section">
                <h3>Conversation</h3>
                <div className="messages-list">
                  {/* Initial description */}
                  <div className="message client">
                    <div className="message-avatar">
                      {selectedTicket.client.name.charAt(0)}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">{selectedTicket.client.name}</span>
                        <span className="message-time">{formatFullDate(selectedTicket.createdAt)}</span>
                      </div>
                      <p>{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Thread messages */}
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`message ${message.sender}`}>
                      <div className="message-avatar">
                        {message.senderName.charAt(0)}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">{message.senderName}</span>
                          <span className="message-time">{formatFullDate(message.timestamp)}</span>
                        </div>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="reply-box">
                  <textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="reply-actions">
                    <button className="btn-attach">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button 
                      className="btn-send"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" /> Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-ticket-selected">
              <MessageSquare className="w-12 h-12" />
              <h3>Select a Ticket</h3>
              <p>Choose a ticket from the list to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
