'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, ArrowLeft, RefreshCw, Settings, Download, Filter,
  Plus, Search, MoreVertical, Eye, Edit2, Trash2, Send, Copy,
  CheckCircle, Clock, AlertTriangle, XCircle, DollarSign, Calendar,
  Building2, User, Mail, Phone, MapPin, CreditCard, Printer,
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Percent,
  ChevronRight, ChevronDown, ExternalLink, Receipt, Banknote,
  FileSpreadsheet, Repeat, Tag, Package, BarChart3
} from 'lucide-react';
import './invoicing.css';

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms: string;
  lastViewed?: string;
  sentAt?: string;
  paidAt?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
}

interface InvoiceMetrics {
  totalRevenue: number;
  paidInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  overdueCount: number;
  avgPaymentDays: number;
  collectionRate: number;
  monthlyGrowth: number;
}

interface RecurringInvoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDate: string;
  status: 'active' | 'paused' | 'cancelled';
  createdCount: number;
}

const sampleInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'INV-2024-0142',
    clientId: 'cli-1',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    status: 'paid',
    issueDate: '2024-01-10',
    dueDate: '2024-01-25',
    subtotal: 12500,
    taxRate: 8.5,
    taxAmount: 1062.50,
    discount: 0,
    total: 13562.50,
    paidAmount: 13562.50,
    currency: 'USD',
    items: [
      { id: 'item-1', description: 'Enterprise License - Annual', quantity: 1, unitPrice: 9500, total: 9500, taxable: true },
      { id: 'item-2', description: 'Premium Support Package', quantity: 1, unitPrice: 3000, total: 3000, taxable: true }
    ],
    paymentTerms: 'Net 15',
    sentAt: '2024-01-10T10:00:00Z',
    paidAt: '2024-01-18T14:30:00Z'
  },
  {
    id: 'inv-2',
    number: 'INV-2024-0143',
    clientId: 'cli-2',
    clientName: 'TechStart Inc',
    clientEmail: 'accounting@techstart.io',
    status: 'sent',
    issueDate: '2024-01-12',
    dueDate: '2024-01-27',
    subtotal: 8750,
    taxRate: 8.5,
    taxAmount: 743.75,
    discount: 500,
    total: 8993.75,
    paidAmount: 0,
    currency: 'USD',
    items: [
      { id: 'item-3', description: 'Consulting Services - 35 hours', quantity: 35, unitPrice: 250, total: 8750, taxable: true }
    ],
    paymentTerms: 'Net 15',
    sentAt: '2024-01-12T09:15:00Z'
  },
  {
    id: 'inv-3',
    number: 'INV-2024-0144',
    clientId: 'cli-3',
    clientName: 'Global Dynamics',
    clientEmail: 'finance@globaldynamics.com',
    status: 'overdue',
    issueDate: '2024-01-01',
    dueDate: '2024-01-15',
    subtotal: 25000,
    taxRate: 8.5,
    taxAmount: 2125,
    discount: 0,
    total: 27125,
    paidAmount: 0,
    currency: 'USD',
    items: [
      { id: 'item-4', description: 'Platform Integration', quantity: 1, unitPrice: 15000, total: 15000, taxable: true },
      { id: 'item-5', description: 'Data Migration Services', quantity: 1, unitPrice: 10000, total: 10000, taxable: true }
    ],
    paymentTerms: 'Net 15',
    sentAt: '2024-01-01T08:00:00Z'
  },
  {
    id: 'inv-4',
    number: 'INV-2024-0145',
    clientId: 'cli-4',
    clientName: 'InnovateTech',
    clientEmail: 'pay@innovatetech.co',
    status: 'viewed',
    issueDate: '2024-01-14',
    dueDate: '2024-01-29',
    subtotal: 5250,
    taxRate: 8.5,
    taxAmount: 446.25,
    discount: 0,
    total: 5696.25,
    paidAmount: 0,
    currency: 'USD',
    items: [
      { id: 'item-6', description: 'Monthly SaaS Subscription', quantity: 3, unitPrice: 1750, total: 5250, taxable: true }
    ],
    paymentTerms: 'Net 15',
    sentAt: '2024-01-14T11:30:00Z',
    lastViewed: '2024-01-15T09:45:00Z'
  },
  {
    id: 'inv-5',
    number: 'INV-2024-0146',
    clientId: 'cli-1',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    status: 'draft',
    issueDate: '2024-01-15',
    dueDate: '2024-01-30',
    subtotal: 18500,
    taxRate: 8.5,
    taxAmount: 1572.50,
    discount: 1000,
    total: 19072.50,
    paidAmount: 0,
    currency: 'USD',
    items: [
      { id: 'item-7', description: 'Custom Development - Phase 2', quantity: 1, unitPrice: 18500, total: 18500, taxable: true }
    ],
    paymentTerms: 'Net 15'
  },
  {
    id: 'inv-6',
    number: 'INV-2024-0141',
    clientId: 'cli-5',
    clientName: 'BlueSky Analytics',
    clientEmail: 'ap@bluesky.ai',
    status: 'paid',
    issueDate: '2024-01-05',
    dueDate: '2024-01-20',
    subtotal: 7500,
    taxRate: 8.5,
    taxAmount: 637.50,
    discount: 0,
    total: 8137.50,
    paidAmount: 8137.50,
    currency: 'USD',
    items: [
      { id: 'item-8', description: 'API Access - Enterprise Tier', quantity: 1, unitPrice: 7500, total: 7500, taxable: true }
    ],
    paymentTerms: 'Net 15',
    sentAt: '2024-01-05T14:00:00Z',
    paidAt: '2024-01-12T10:15:00Z'
  }
];

const sampleClients: Client[] = [
  { id: 'cli-1', name: 'Acme Corporation', email: 'billing@acme.com', phone: '+1 (555) 123-4567', address: '123 Business Ave, New York, NY 10001', company: 'Acme Corp', totalInvoiced: 32635, totalPaid: 13562.50, outstandingBalance: 19072.50, invoiceCount: 2 },
  { id: 'cli-2', name: 'TechStart Inc', email: 'accounting@techstart.io', phone: '+1 (555) 234-5678', address: '456 Startup Blvd, San Francisco, CA 94105', company: 'TechStart', totalInvoiced: 8993.75, totalPaid: 0, outstandingBalance: 8993.75, invoiceCount: 1 },
  { id: 'cli-3', name: 'Global Dynamics', email: 'finance@globaldynamics.com', phone: '+1 (555) 345-6789', address: '789 Corporate Dr, Chicago, IL 60601', company: 'Global Dynamics Inc', totalInvoiced: 27125, totalPaid: 0, outstandingBalance: 27125, invoiceCount: 1 },
  { id: 'cli-4', name: 'InnovateTech', email: 'pay@innovatetech.co', phone: '+1 (555) 456-7890', address: '321 Innovation Way, Austin, TX 78701', company: 'InnovateTech LLC', totalInvoiced: 5696.25, totalPaid: 0, outstandingBalance: 5696.25, invoiceCount: 1 },
  { id: 'cli-5', name: 'BlueSky Analytics', email: 'ap@bluesky.ai', phone: '+1 (555) 567-8901', address: '654 Data Center Rd, Seattle, WA 98101', company: 'BlueSky AI', totalInvoiced: 8137.50, totalPaid: 8137.50, outstandingBalance: 0, invoiceCount: 1 }
];

const sampleRecurring: RecurringInvoice[] = [
  { id: 'rec-1', clientId: 'cli-1', clientName: 'Acme Corporation', amount: 9500, frequency: 'yearly', nextDate: '2025-01-10', status: 'active', createdCount: 3 },
  { id: 'rec-2', clientId: 'cli-4', clientName: 'InnovateTech', amount: 1750, frequency: 'monthly', nextDate: '2024-02-14', status: 'active', createdCount: 8 },
  { id: 'rec-3', clientId: 'cli-5', clientName: 'BlueSky Analytics', amount: 7500, frequency: 'quarterly', nextDate: '2024-04-05', status: 'active', createdCount: 4 },
  { id: 'rec-4', clientId: 'cli-2', clientName: 'TechStart Inc', amount: 2500, frequency: 'monthly', nextDate: '2024-02-01', status: 'paused', createdCount: 6 }
];

export default function InvoicingSystem(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients' | 'recurring' | 'analytics'>('invoices');
  const [invoices] = useState<Invoice[]>(sampleInvoices);
  const [clients] = useState<Client[]>(sampleClients);
  const [recurring] = useState<RecurringInvoice[]>(sampleRecurring);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const metrics: InvoiceMetrics = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    pendingAmount: invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((sum, i) => sum + i.total, 0),
    overdueAmount: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
    overdueCount: invoices.filter(i => i.status === 'overdue').length,
    avgPaymentDays: 8,
    collectionRate: 94.5,
    monthlyGrowth: 12.3
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRefresh = (): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusIcon = (status: Invoice['status']): React.ReactNode => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'sent':
      case 'viewed': return <Clock size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'draft': return <Edit2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

  const renderInvoicesTab = (): React.ReactNode => (
    <div className="invoices-tab">
      <div className="invoices-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </div>

      <div className="invoices-layout">
        <div className="invoices-list">
          <div className="invoices-table">
            <div className="table-header">
              <span>Invoice</span>
              <span>Client</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Actions</span>
            </div>
            {filteredInvoices.map(invoice => (
              <div 
                key={invoice.id} 
                className={`table-row ${invoice.status} ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="invoice-cell">
                  <div className="invoice-icon">
                    <FileText size={18} />
                  </div>
                  <div className="invoice-info">
                    <span className="invoice-number">{invoice.number}</span>
                    <span className="invoice-date">Issued {formatDate(invoice.issueDate)}</span>
                  </div>
                </div>
                <div className="client-cell">
                  <span className="client-name">{invoice.clientName}</span>
                  <span className="client-email">{invoice.clientEmail}</span>
                </div>
                <div className="amount-cell">
                  <span className="amount">{formatCurrency(invoice.total, invoice.currency)}</span>
                  {invoice.paidAmount > 0 && invoice.paidAmount < invoice.total && (
                    <span className="paid-amount">Paid: {formatCurrency(invoice.paidAmount)}</span>
                  )}
                </div>
                <div className={`status-cell ${invoice.status}`}>
                  {getStatusIcon(invoice.status)}
                  <span>{invoice.status}</span>
                  {invoice.status === 'overdue' && (
                    <span className="overdue-days">{getDaysOverdue(invoice.dueDate)}d</span>
                  )}
                </div>
                <div className="due-cell">
                  <Calendar size={14} />
                  {formatDate(invoice.dueDate)}
                </div>
                <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon small" title="View">
                    <Eye size={14} />
                  </button>
                  <button className="btn-icon small" title="Send">
                    <Send size={14} />
                  </button>
                  <button className="btn-icon small" title="More">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedInvoice && (
          <div className="invoice-detail-panel">
            <div className="panel-header">
              <div className="panel-title">
                <h3>{selectedInvoice.number}</h3>
                <span className={`status-badge ${selectedInvoice.status}`}>
                  {getStatusIcon(selectedInvoice.status)}
                  {selectedInvoice.status}
                </span>
              </div>
              <button className="btn-icon small" onClick={() => setSelectedInvoice(null)}>
                <XCircle size={16} />
              </button>
            </div>

            <div className="panel-content">
              <div className="invoice-parties">
                <div className="party from">
                  <span className="party-label">From</span>
                  <span className="party-name">CUBE Elite</span>
                  <span className="party-detail">billing@cubeelite.com</span>
                </div>
                <div className="party to">
                  <span className="party-label">Bill To</span>
                  <span className="party-name">{selectedInvoice.clientName}</span>
                  <span className="party-detail">{selectedInvoice.clientEmail}</span>
                </div>
              </div>

              <div className="invoice-dates">
                <div className="date-item">
                  <span className="date-label">Issue Date</span>
                  <span className="date-value">{formatDate(selectedInvoice.issueDate)}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Due Date</span>
                  <span className="date-value">{formatDate(selectedInvoice.dueDate)}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Terms</span>
                  <span className="date-value">{selectedInvoice.paymentTerms}</span>
                </div>
              </div>

              <div className="invoice-items">
                <h4>Items</h4>
                <div className="items-table">
                  <div className="items-header">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {selectedInvoice.items.map(item => (
                    <div key={item.id} className="items-row">
                      <span className="item-desc">{item.description}</span>
                      <span className="item-qty">{item.quantity}</span>
                      <span className="item-price">{formatCurrency(item.unitPrice)}</span>
                      <span className="item-total">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="invoice-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="total-row discount">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Tax ({selectedInvoice.taxRate}%)</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
                {selectedInvoice.paidAmount > 0 && (
                  <>
                    <div className="total-row paid">
                      <span>Paid</span>
                      <span>-{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="total-row balance">
                      <span>Balance Due</span>
                      <span>{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="invoice-timeline">
                <h4>Activity</h4>
                <div className="timeline-items">
                  {selectedInvoice.paidAt && (
                    <div className="timeline-item paid">
                      <CheckCircle size={14} />
                      <div className="timeline-info">
                        <span className="timeline-action">Payment received</span>
                        <span className="timeline-date">{formatDate(selectedInvoice.paidAt)}</span>
                      </div>
                    </div>
                  )}
                  {selectedInvoice.lastViewed && (
                    <div className="timeline-item viewed">
                      <Eye size={14} />
                      <div className="timeline-info">
                        <span className="timeline-action">Viewed by client</span>
                        <span className="timeline-date">{formatDate(selectedInvoice.lastViewed)}</span>
                      </div>
                    </div>
                  )}
                  {selectedInvoice.sentAt && (
                    <div className="timeline-item sent">
                      <Send size={14} />
                      <div className="timeline-info">
                        <span className="timeline-action">Invoice sent</span>
                        <span className="timeline-date">{formatDate(selectedInvoice.sentAt)}</span>
                      </div>
                    </div>
                  )}
                  <div className="timeline-item created">
                    <FileText size={14} />
                    <div className="timeline-info">
                      <span className="timeline-action">Invoice created</span>
                      <span className="timeline-date">{formatDate(selectedInvoice.issueDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <Printer size={14} />
                Print
              </button>
              <button className="btn-outline">
                <Copy size={14} />
                Duplicate
              </button>
              {selectedInvoice.status === 'draft' && (
                <button className="btn-primary">
                  <Send size={14} />
                  Send Invoice
                </button>
              )}
              {['sent', 'viewed', 'overdue'].includes(selectedInvoice.status) && (
                <button className="btn-primary">
                  <Banknote size={14} />
                  Record Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClientsTab = (): React.ReactNode => (
    <div className="clients-tab">
      <div className="clients-header">
        <h3>Clients</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Client
        </button>
      </div>

      <div className="clients-grid">
        {clients.map(client => (
          <div 
            key={client.id} 
            className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
            onClick={() => setSelectedClient(client)}
          >
            <div className="client-header">
              <div className="client-avatar">
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="client-info">
                <h4>{client.name}</h4>
                <span className="client-company">{client.company}</span>
              </div>
            </div>

            <div className="client-contact">
              <div className="contact-item">
                <Mail size={14} />
                {client.email}
              </div>
              <div className="contact-item">
                <Phone size={14} />
                {client.phone}
              </div>
            </div>

            <div className="client-financials">
              <div className="financial-item">
                <span className="financial-label">Total Invoiced</span>
                <span className="financial-value">{formatCurrency(client.totalInvoiced)}</span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Paid</span>
                <span className="financial-value positive">{formatCurrency(client.totalPaid)}</span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Outstanding</span>
                <span className={`financial-value ${client.outstandingBalance > 0 ? 'warning' : ''}`}>
                  {formatCurrency(client.outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="client-footer">
              <span className="invoice-count">
                <FileText size={14} />
                {client.invoiceCount} invoices
              </span>
              <button className="btn-outline small">
                <Plus size={14} />
                New Invoice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecurringTab = (): React.ReactNode => (
    <div className="recurring-tab">
      <div className="recurring-header">
        <h3>Recurring Invoices</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Recurring
        </button>
      </div>

      <div className="recurring-table">
        <div className="table-header">
          <span>Client</span>
          <span>Amount</span>
          <span>Frequency</span>
          <span>Next Date</span>
          <span>Status</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        {recurring.map(rec => (
          <div key={rec.id} className={`table-row ${rec.status}`}>
            <div className="client-cell">
              <Repeat size={16} />
              <span>{rec.clientName}</span>
            </div>
            <span className="amount-cell">{formatCurrency(rec.amount)}</span>
            <span className="frequency-cell">{rec.frequency}</span>
            <div className="next-date-cell">
              <Calendar size={14} />
              {formatDate(rec.nextDate)}
            </div>
            <div className={`status-cell ${rec.status}`}>
              {rec.status === 'active' && <CheckCircle size={14} />}
              {rec.status === 'paused' && <Clock size={14} />}
              {rec.status === 'cancelled' && <XCircle size={14} />}
              {rec.status}
            </div>
            <span className="created-cell">{rec.createdCount} invoices</span>
            <div className="actions-cell">
              <button className="btn-icon small">
                <Edit2 size={14} />
              </button>
              {rec.status === 'active' ? (
                <button className="btn-icon small">
                  <Clock size={14} />
                </button>
              ) : (
                <button className="btn-icon small">
                  <CheckCircle size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = (): React.ReactNode => (
    <div className="analytics-tab">
      <div className="analytics-header">
        <h3>Invoice Analytics</h3>
        <select className="period-select">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">This year</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card revenue">
          <div className="card-icon">
            <DollarSign size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Revenue</span>
            <span className="card-value">{formatCurrency(metrics.totalRevenue)}</span>
            <span className="card-change positive">
              <TrendingUp size={14} />
              +{metrics.monthlyGrowth}% from last month
            </span>
          </div>
        </div>

        <div className="analytics-card pending">
          <div className="card-icon">
            <Clock size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Pending Amount</span>
            <span className="card-value">{formatCurrency(metrics.pendingAmount)}</span>
            <span className="card-sub">{invoices.filter(i => ['sent', 'viewed'].includes(i.status)).length} invoices</span>
          </div>
        </div>

        <div className="analytics-card overdue">
          <div className="card-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Overdue</span>
            <span className="card-value">{formatCurrency(metrics.overdueAmount)}</span>
            <span className="card-sub">{metrics.overdueCount} invoices overdue</span>
          </div>
        </div>

        <div className="analytics-card collection">
          <div className="card-icon">
            <Percent size={20} />
          </div>
          <div className="card-content">
            <span className="card-label">Collection Rate</span>
            <span className="card-value">{metrics.collectionRate}%</span>
            <span className="card-sub">Avg {metrics.avgPaymentDays} days to pay</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h4>Revenue by Month</h4>
          <div className="bar-chart">
            {['Oct', 'Nov', 'Dec', 'Jan'].map((month, idx) => (
              <div key={month} className="chart-bar-group">
                <div 
                  className="chart-bar"
                  style={{ height: `${[65, 72, 88, 95][idx]}%` }}
                ></div>
                <span className="bar-label">{month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h4>Invoice Status Distribution</h4>
          <div className="status-distribution">
            <div className="status-item">
              <div className="status-bar paid" style={{ width: '35%' }}></div>
              <span className="status-label">Paid</span>
              <span className="status-value">{invoices.filter(i => i.status === 'paid').length}</span>
            </div>
            <div className="status-item">
              <div className="status-bar sent" style={{ width: '20%' }}></div>
              <span className="status-label">Sent</span>
              <span className="status-value">{invoices.filter(i => i.status === 'sent').length}</span>
            </div>
            <div className="status-item">
              <div className="status-bar viewed" style={{ width: '15%' }}></div>
              <span className="status-label">Viewed</span>
              <span className="status-value">{invoices.filter(i => i.status === 'viewed').length}</span>
            </div>
            <div className="status-item">
              <div className="status-bar overdue" style={{ width: '18%' }}></div>
              <span className="status-label">Overdue</span>
              <span className="status-value">{invoices.filter(i => i.status === 'overdue').length}</span>
            </div>
            <div className="status-item">
              <div className="status-bar draft" style={{ width: '12%' }}></div>
              <span className="status-label">Draft</span>
              <span className="status-value">{invoices.filter(i => i.status === 'draft').length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="top-clients">
        <h4>Top Clients by Revenue</h4>
        <div className="top-clients-list">
          {clients.sort((a, b) => b.totalInvoiced - a.totalInvoiced).slice(0, 5).map((client, idx) => (
            <div key={client.id} className="top-client-item">
              <span className="rank">{idx + 1}</span>
              <div className="client-info">
                <span className="client-name">{client.name}</span>
                <span className="invoice-count">{client.invoiceCount} invoices</span>
              </div>
              <span className="client-revenue">{formatCurrency(client.totalInvoiced)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="invoicing-system">
      <div className="inv__header">
        <div className="inv__title-section">
          <div className="inv__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Invoicing</h1>
            <p>Create, send, and track invoices</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </div>

      <div className="invoice-summary">
        <div className="summary-card total">
          <div className="summary-icon"><DollarSign size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalRevenue)}</span>
            <span className="summary-label">Collected</span>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="summary-icon"><Clock size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.pendingAmount)}</span>
            <span className="summary-label">Pending</span>
          </div>
        </div>
        <div className="summary-card overdue">
          <div className="summary-icon"><AlertTriangle size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.overdueAmount)}</span>
            <span className="summary-label">Overdue</span>
          </div>
        </div>
        <div className="summary-card rate">
          <div className="summary-icon"><Percent size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">{metrics.collectionRate}%</span>
            <span className="summary-label">Collection Rate</span>
          </div>
        </div>
        <div className="summary-card growth">
          <div className="summary-icon"><TrendingUp size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">+{metrics.monthlyGrowth}%</span>
            <span className="summary-label">Monthly Growth</span>
          </div>
        </div>
      </div>

      <div className="inv__tabs">
        <button 
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={16} />
          Invoices
          <span className="tab-badge">{invoices.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Building2 size={16} />
          Clients
          <span className="tab-badge">{clients.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          <Repeat size={16} />
          Recurring
          <span className="tab-badge">{recurring.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      <div className="inv__content">
        {activeTab === 'invoices' && renderInvoicesTab()}
        {activeTab === 'clients' && renderClientsTab()}
        {activeTab === 'recurring' && renderRecurringTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
}
