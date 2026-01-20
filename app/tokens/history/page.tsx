'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, History, Search, Filter, Download,
  ArrowUpRight, ArrowDownLeft, Coins, Gift, RefreshCw,
  Calendar, Clock, ExternalLink, ChevronLeft, ChevronRight,
  FileText, CheckCircle, XCircle, Loader2, AlertCircle
} from 'lucide-react';
import '../tokens.css';

// ============================================
// Types
// ============================================

interface TokenTransaction {
  id: string;
  type: 'purchase' | 'stake' | 'unstake' | 'reward' | 'transfer_in' | 'transfer_out' | 'airdrop';
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
  from?: string;
  to?: string;
  description?: string;
  usdValue?: number;
}

interface FilterOptions {
  type: string;
  status: string;
  dateRange: string;
}

// ============================================
// Constants
// ============================================

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'stake', label: 'Staking' },
  { value: 'unstake', label: 'Unstaking' },
  { value: 'reward', label: 'Rewards' },
  { value: 'transfer_in', label: 'Received' },
  { value: 'transfer_out', label: 'Sent' },
  { value: 'airdrop', label: 'Airdrops' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' }
];

const ITEMS_PER_PAGE = 20;

// ============================================
// Mock Data
// ============================================

const generateMockTransactions = (): TokenTransaction[] => {
  const types: TokenTransaction['type'][] = ['purchase', 'stake', 'unstake', 'reward', 'transfer_in', 'transfer_out', 'airdrop'];
  const statuses: TokenTransaction['status'][] = ['completed', 'completed', 'completed', 'pending', 'failed'];
  
  const transactions: TokenTransaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 100; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const daysAgo = Math.floor(Math.random() * 365);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    let amount = 0;
    switch (type) {
      case 'purchase':
        amount = [1000, 5000, 10000, 50000][Math.floor(Math.random() * 4)];
        break;
      case 'stake':
      case 'unstake':
        amount = Math.floor(Math.random() * 20000) + 1000;
        break;
      case 'reward':
        amount = Math.floor(Math.random() * 500) + 10;
        break;
      case 'transfer_in':
      case 'transfer_out':
        amount = Math.floor(Math.random() * 5000) + 100;
        break;
      case 'airdrop':
        amount = [100, 250, 500, 1000][Math.floor(Math.random() * 4)];
        break;
    }
    
    transactions.push({
      id: `tx_${i}_${Date.now()}`,
      type,
      amount,
      timestamp,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      hash: `0x${Math.random().toString(16).substr(2, 40)}`,
      description: getTransactionDescription(type, amount),
      usdValue: amount * 2.45
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const getTransactionDescription = (type: TokenTransaction['type'], amount: number): string => {
  switch (type) {
    case 'purchase': return `Purchased ${amount.toLocaleString()} CUBEX tokens`;
    case 'stake': return `Staked ${amount.toLocaleString()} CUBEX for rewards`;
    case 'unstake': return `Unstaked ${amount.toLocaleString()} CUBEX`;
    case 'reward': return `Staking reward earned`;
    case 'transfer_in': return `Received from external wallet`;
    case 'transfer_out': return `Sent to external wallet`;
    case 'airdrop': return `Community airdrop bonus`;
    default: return 'Token transaction';
  }
};

// ============================================
// Main Component
// ============================================

export default function TokenHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TokenTransaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters, searchQuery]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const txList = await invoke<TokenTransaction[]>('get_all_token_transactions');
      setTransactions(txList.map(tx => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      })));
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions(generateMockTransactions());
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      
      switch (filters.dateRange) {
        case '7d':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoff = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          cutoff = new Date(0);
      }
      
      filtered = filtered.filter(tx => tx.timestamp >= cutoff);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(query) ||
        tx.hash?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTypeIcon = (type: TokenTransaction['type']) => {
    switch (type) {
      case 'purchase': return <Coins className="w-4 h-4" />;
      case 'stake': return <ArrowDownLeft className="w-4 h-4" />;
      case 'unstake': return <ArrowUpRight className="w-4 h-4" />;
      case 'reward': return <Gift className="w-4 h-4" />;
      case 'transfer_in': return <ArrowDownLeft className="w-4 h-4" />;
      case 'transfer_out': return <ArrowUpRight className="w-4 h-4" />;
      case 'airdrop': return <Gift className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: TokenTransaction['type']): string => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'stake': return 'Stake';
      case 'unstake': return 'Unstake';
      case 'reward': return 'Reward';
      case 'transfer_in': return 'Received';
      case 'transfer_out': return 'Sent';
      case 'airdrop': return 'Airdrop';
      default: return 'Transaction';
    }
  };

  const getStatusIcon = (status: TokenTransaction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isPositiveTransaction = (type: TokenTransaction['type']): boolean => {
    return ['purchase', 'reward', 'transfer_in', 'airdrop', 'unstake'].includes(type);
  };

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'USD Value', 'Status', 'Hash', 'Description'];
    const rows = filteredTransactions.map(tx => [
      formatDate(tx.timestamp),
      getTypeLabel(tx.type),
      tx.amount.toString(),
      tx.usdValue?.toFixed(2) || '',
      tx.status,
      tx.hash || '',
      tx.description || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubex-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateSummary = () => {
    return filteredTransactions.reduce((acc, tx) => {
      const isPositive = isPositiveTransaction(tx.type);
      return {
        totalIn: acc.totalIn + (isPositive ? tx.amount : 0),
        totalOut: acc.totalOut + (!isPositive ? tx.amount : 0),
        totalRewards: acc.totalRewards + (tx.type === 'reward' ? tx.amount : 0),
        count: acc.count + 1
      };
    }, { totalIn: 0, totalOut: 0, totalRewards: 0, count: 0 });
  };

  const summary = calculateSummary();

  return (
    <div className="history-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/tokens')} title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <History className="w-6 h-6" />
            <div>
              <h1>Transaction History</h1>
              <p>View all your CUBEX token transactions</p>
            </div>
          </div>
        </div>
        <button className="btn-secondary" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {/* Summary Cards */}
      <div className="history-summary">
        <div className="summary-card">
          <span className="summary-label">Total Received</span>
          <span className="summary-value positive">+{formatNumber(summary.totalIn)} CUBEX</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Sent/Staked</span>
          <span className="summary-value negative">-{formatNumber(summary.totalOut)} CUBEX</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Rewards</span>
          <span className="summary-value reward">+{formatNumber(summary.totalRewards)} CUBEX</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Transactions</span>
          <span className="summary-value">{formatNumber(summary.count)}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="history-controls">
        <div className="search-bar">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search by ID, hash, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label htmlFor="filter-type">Type</label>
            <select 
              id="filter-type"
              title="Filter by transaction type"
              value={filters.type} 
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              {TRANSACTION_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-status">Status</label>
            <select 
              id="filter-status"
              title="Filter by transaction status"
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-date">Date Range</label>
            <select 
              id="filter-date"
              title="Filter by date range"
              value={filters.dateRange} 
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            >
              {DATE_RANGES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button 
            className="clear-filters"
            onClick={() => setFilters({ type: 'all', status: 'all', dateRange: 'all' })}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Transaction List */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="empty-state">
            <History className="w-12 h-12" />
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="transactions-table">
              <div className="table-header">
                <span className="col-date">Date</span>
                <span className="col-type">Type</span>
                <span className="col-amount">Amount</span>
                <span className="col-value">USD Value</span>
                <span className="col-status">Status</span>
                <span className="col-actions">Actions</span>
              </div>
              {paginatedTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className={`transaction-row ${tx.status}`}
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="col-date">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <span className="date">{formatDate(tx.timestamp)}</span>
                      <span className="time">{formatTime(tx.timestamp)}</span>
                    </div>
                  </div>
                  <div className="col-type">
                    <span className={`type-badge ${tx.type}`}>
                      {getTypeIcon(tx.type)}
                      {getTypeLabel(tx.type)}
                    </span>
                  </div>
                  <div className={`col-amount ${isPositiveTransaction(tx.type) ? 'positive' : 'negative'}`}>
                    {isPositiveTransaction(tx.type) ? '+' : '-'}{formatNumber(tx.amount)} CUBEX
                  </div>
                  <div className="col-value">
                    {tx.usdValue ? formatCurrency(tx.usdValue) : '-'}
                  </div>
                  <div className="col-status">
                    <span className={`status-badge ${tx.status}`}>
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </span>
                  </div>
                  <div className="col-actions">
                    {tx.hash && (
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank');
                        }}
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={() => setSelectedTx(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value mono">{selectedTx.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className={`type-badge ${selectedTx.type}`}>
                  {getTypeIcon(selectedTx.type)}
                  {getTypeLabel(selectedTx.type)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className={`detail-value ${isPositiveTransaction(selectedTx.type) ? 'positive' : 'negative'}`}>
                  {isPositiveTransaction(selectedTx.type) ? '+' : '-'}{formatNumber(selectedTx.amount)} CUBEX
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">USD Value</span>
                <span className="detail-value">{selectedTx.usdValue ? formatCurrency(selectedTx.usdValue) : '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">{formatDate(selectedTx.timestamp)} at {formatTime(selectedTx.timestamp)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${selectedTx.status}`}>
                  {getStatusIcon(selectedTx.status)}
                  {selectedTx.status}
                </span>
              </div>
              {selectedTx.hash && (
                <div className="detail-row">
                  <span className="detail-label">Transaction Hash</span>
                  <span className="detail-value mono">{selectedTx.hash.substring(0, 20)}...{selectedTx.hash.substring(selectedTx.hash.length - 8)}</span>
                </div>
              )}
              {selectedTx.description && (
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedTx.description}</span>
                </div>
              )}
            </div>
            {selectedTx.hash && (
              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => window.open(`https://etherscan.io/tx/${selectedTx.hash}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" /> View on Explorer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
