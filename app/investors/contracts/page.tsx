'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, CheckCircle, Clock, AlertCircle, Download,
  Eye, Pen, Shield, Calendar, DollarSign, User,
  ChevronRight, Filter, Search, ArrowRight, Check,
  X, ExternalLink, Copy, RefreshCw
} from 'lucide-react';
import './contracts.css';

// ============================================
// Types
// ============================================

interface Contract {
  id: string;
  contractNumber: string;
  type: 'investment' | 'nda' | 'terms' | 'addendum';
  title: string;
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  investmentAmount?: number;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  signatures: Signature[];
  documents: ContractDocument[];
  createdAt: string;
  updatedAt: string;
}

interface Signature {
  party: 'investor' | 'company';
  name: string;
  signedAt: string | null;
  ipAddress?: string;
}

interface ContractDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx';
  size: number;
  url: string;
}

// ============================================
// Mock Data
// ============================================

const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'CTR-001',
    contractNumber: 'INV-2025-0001',
    type: 'investment',
    title: 'Seed Investment Agreement - Series A',
    status: 'active',
    investmentAmount: 50000,
    interestRate: 12,
    startDate: '2025-06-15',
    endDate: '2027-06-15',
    signatures: [
      { party: 'investor', name: 'John Doe', signedAt: '2025-06-14T10:30:00Z', ipAddress: '192.168.1.1' },
      { party: 'company', name: 'CUBE AI Inc.', signedAt: '2025-06-15T09:00:00Z' }
    ],
    documents: [
      { id: 'DOC-001', name: 'Investment_Agreement_Signed.pdf', type: 'pdf', size: 2457600, url: '#' },
      { id: 'DOC-002', name: 'Terms_and_Conditions.pdf', type: 'pdf', size: 1024000, url: '#' }
    ],
    createdAt: '2025-06-10',
    updatedAt: '2025-06-15'
  },
  {
    id: 'CTR-002',
    contractNumber: 'NDA-2025-0042',
    type: 'nda',
    title: 'Non-Disclosure Agreement',
    status: 'active',
    startDate: '2025-05-01',
    signatures: [
      { party: 'investor', name: 'John Doe', signedAt: '2025-05-01T14:00:00Z' },
      { party: 'company', name: 'CUBE AI Inc.', signedAt: '2025-05-01T15:00:00Z' }
    ],
    documents: [
      { id: 'DOC-003', name: 'NDA_Signed.pdf', type: 'pdf', size: 512000, url: '#' }
    ],
    createdAt: '2025-04-28',
    updatedAt: '2025-05-01'
  },
  {
    id: 'CTR-003',
    contractNumber: 'INV-2026-0015',
    type: 'investment',
    title: 'Strategic Investment Agreement',
    status: 'pending_signature',
    investmentAmount: 100000,
    interestRate: 15,
    startDate: '2026-01-15',
    endDate: '2028-01-15',
    signatures: [
      { party: 'investor', name: 'John Doe', signedAt: null },
      { party: 'company', name: 'CUBE AI Inc.', signedAt: null }
    ],
    documents: [
      { id: 'DOC-004', name: 'Strategic_Investment_Draft.pdf', type: 'pdf', size: 3145728, url: '#' }
    ],
    createdAt: '2026-01-05',
    updatedAt: '2026-01-08'
  },
  {
    id: 'CTR-004',
    contractNumber: 'ADD-2025-0003',
    type: 'addendum',
    title: 'Addendum to Investment Agreement - Token Allocation',
    status: 'completed',
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    signatures: [
      { party: 'investor', name: 'John Doe', signedAt: '2025-09-01T11:00:00Z' },
      { party: 'company', name: 'CUBE AI Inc.', signedAt: '2025-09-01T12:00:00Z' }
    ],
    documents: [
      { id: 'DOC-005', name: 'Addendum_Token_Allocation.pdf', type: 'pdf', size: 768000, url: '#' }
    ],
    createdAt: '2025-08-25',
    updatedAt: '2025-09-01'
  }
];

// ============================================
// Helper Functions
// ============================================

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

// ============================================
// Main Component
// ============================================

export default function InvestorContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setContracts(MOCK_CONTRACTS);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    const matchesType = filterType === 'all' || contract.type === filterType;
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'pending_signature': return <Pen className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      case 'terminated': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Contract['status']): string => {
    switch (status) {
      case 'draft': return 'draft';
      case 'pending_signature': return 'pending';
      case 'active': return 'active';
      case 'completed': return 'completed';
      case 'terminated': return 'terminated';
      default: return '';
    }
  };

  const getTypeLabel = (type: Contract['type']): string => {
    switch (type) {
      case 'investment': return 'Investment';
      case 'nda': return 'NDA';
      case 'terms': return 'Terms';
      case 'addendum': return 'Addendum';
      default: return type;
    }
  };

  const handleSign = async (contractId: string) => {
    // Mock sign functionality
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      const updatedSignatures = contract.signatures.map(sig => 
        sig.party === 'investor' && !sig.signedAt 
          ? { ...sig, signedAt: new Date().toISOString() }
          : sig
      );
      const updatedContract = { ...contract, signatures: updatedSignatures };
      setContracts(contracts.map(c => c.id === contractId ? updatedContract : c));
      setSelectedContract(updatedContract);
    }
  };

  const copyContractNumber = (num: string) => {
    navigator.clipboard.writeText(num);
  };

  if (loading) {
    return (
      <div className="contracts-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contracts-page">
      {/* Header */}
      <header className="contracts-header">
        <div className="header-content">
          <div className="header-title">
            <FileText className="w-8 h-8" />
            <div>
              <h1>Contracts & Agreements</h1>
              <p>View and manage your investment contracts</p>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => router.push('/investors/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="contracts-stats">
        <div className="stat-card">
          <span className="stat-value">{contracts.length}</span>
          <span className="stat-label">Total Contracts</span>
        </div>
        <div className="stat-card active">
          <span className="stat-value">{contracts.filter(c => c.status === 'active').length}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{contracts.filter(c => c.status === 'pending_signature').length}</span>
          <span className="stat-label">Pending Signature</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {formatCurrency(contracts.reduce((sum, c) => sum + (c.investmentAmount || 0), 0))}
          </span>
          <span className="stat-label">Total Invested</span>
        </div>
      </section>

      {/* Filters */}
      <div className="contracts-filters">
        <div className="search-box">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter className="w-4 h-4" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_signature">Pending Signature</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <div className="filter-group">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="investment">Investment</option>
            <option value="nda">NDA</option>
            <option value="addendum">Addendum</option>
            <option value="terms">Terms</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="contracts-content">
        {/* Contracts List */}
        <div className="contracts-list">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
              onClick={() => setSelectedContract(contract)}
            >
              <div className="contract-header">
                <span className={`contract-status ${getStatusColor(contract.status)}`}>
                  {getStatusIcon(contract.status)}
                  {contract.status.replace('_', ' ')}
                </span>
                <span className="contract-type">{getTypeLabel(contract.type)}</span>
              </div>
              
              <h3 className="contract-title">{contract.title}</h3>
              
              <div className="contract-meta">
                <span className="contract-number">
                  <FileText className="w-3 h-3" />
                  {contract.contractNumber}
                </span>
                <span className="contract-date">
                  <Calendar className="w-3 h-3" />
                  {formatDate(contract.startDate)}
                </span>
              </div>
              
              {contract.investmentAmount && (
                <div className="contract-amount">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(contract.investmentAmount)}
                  {contract.interestRate && (
                    <span className="interest-rate">@ {contract.interestRate}% APR</span>
                  )}
                </div>
              )}
              
              <div className="contract-signatures">
                {contract.signatures.map((sig, i) => (
                  <div key={i} className={`signature-badge ${sig.signedAt ? 'signed' : 'pending'}`}>
                    {sig.signedAt ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {sig.party === 'investor' ? 'You' : 'CUBE AI'}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredContracts.length === 0 && (
            <div className="empty-contracts">
              <FileText className="w-12 h-12" />
              <h3>No contracts found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Contract Detail */}
        <div className="contract-detail">
          {selectedContract ? (
            <>
              <div className="detail-header">
                <div className="detail-title">
                  <h2>{selectedContract.title}</h2>
                  <div className="detail-number">
                    <span>{selectedContract.contractNumber}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyContractNumber(selectedContract.contractNumber)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className={`detail-status ${getStatusColor(selectedContract.status)}`}>
                  {getStatusIcon(selectedContract.status)}
                  {selectedContract.status.replace('_', ' ')}
                </span>
              </div>

              {/* Contract Info */}
              <div className="detail-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Contract Type</span>
                    <span className="info-value">{getTypeLabel(selectedContract.type)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-value">{formatDate(selectedContract.startDate)}</span>
                  </div>
                  {selectedContract.endDate && (
                    <div className="info-item">
                      <span className="info-label">End Date</span>
                      <span className="info-value">{formatDate(selectedContract.endDate)}</span>
                    </div>
                  )}
                  {selectedContract.investmentAmount && (
                    <div className="info-item">
                      <span className="info-label">Investment Amount</span>
                      <span className="info-value highlight">
                        {formatCurrency(selectedContract.investmentAmount)}
                      </span>
                    </div>
                  )}
                  {selectedContract.interestRate && (
                    <div className="info-item">
                      <span className="info-label">Interest Rate</span>
                      <span className="info-value">{selectedContract.interestRate}% APR</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Created</span>
                    <span className="info-value">{formatDate(selectedContract.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="detail-section">
                <h3><Shield className="w-5 h-5" /> Signatures</h3>
                <div className="signatures-list">
                  {selectedContract.signatures.map((sig, i) => (
                    <div key={i} className={`signature-item ${sig.signedAt ? 'signed' : 'pending'}`}>
                      <div className="signature-icon">
                        {sig.signedAt ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="signature-info">
                        <span className="signature-party">
                          {sig.party === 'investor' ? 'Investor' : 'Company'}
                        </span>
                        <span className="signature-name">{sig.name}</span>
                        {sig.signedAt && (
                          <span className="signature-date">
                            Signed {formatDateTime(sig.signedAt)}
                          </span>
                        )}
                      </div>
                      {sig.party === 'investor' && !sig.signedAt && (
                        <button 
                          className="btn-sign"
                          onClick={() => handleSign(selectedContract.id)}
                        >
                          <Pen className="w-4 h-4" /> Sign Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="detail-section">
                <h3><FileText className="w-5 h-5" /> Documents</h3>
                <div className="documents-list">
                  {selectedContract.documents.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="document-info">
                        <span className="document-name">{doc.name}</span>
                        <span className="document-size">{formatFileSize(doc.size)}</span>
                      </div>
                      <div className="document-actions">
                        <button className="btn-icon" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="btn-icon" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedContract.status === 'pending_signature' && (
                <div className="detail-actions">
                  <button className="btn-primary full-width">
                    <Pen className="w-5 h-5" /> Review and Sign Contract
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <FileText className="w-12 h-12" />
              <h3>Select a Contract</h3>
              <p>Choose a contract from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
