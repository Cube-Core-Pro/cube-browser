'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, Eye, Folder, Calendar, Shield,
  FileCheck, FileClock, FileWarning, Search, Filter,
  ChevronRight, Upload, RefreshCw, CheckCircle, Lock,
  AlertTriangle, Clock, User, Building
} from 'lucide-react';
import './documents.css';

// ============================================
// Types
// ============================================

interface Document {
  id: string;
  name: string;
  category: 'investment' | 'kyc' | 'tax' | 'legal' | 'reports';
  type: 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg';
  size: number;
  status: 'approved' | 'pending' | 'expired' | 'rejected';
  uploadedAt: string;
  expiresAt?: string;
  description?: string;
  isRequired: boolean;
  url: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
}

// ============================================
// Mock Data
// ============================================

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'DOC-001',
    name: 'Investment_Agreement_2025.pdf',
    category: 'investment',
    type: 'pdf',
    size: 2457600,
    status: 'approved',
    uploadedAt: '2025-06-15T10:30:00Z',
    description: 'Primary investment agreement for Series A participation',
    isRequired: true,
    url: '#'
  },
  {
    id: 'DOC-002',
    name: 'KYC_Verification_Passport.pdf',
    category: 'kyc',
    type: 'pdf',
    size: 1536000,
    status: 'approved',
    uploadedAt: '2025-05-20T14:00:00Z',
    expiresAt: '2030-05-20',
    description: 'Passport copy for identity verification',
    isRequired: true,
    url: '#'
  },
  {
    id: 'DOC-003',
    name: 'Proof_of_Address.pdf',
    category: 'kyc',
    type: 'pdf',
    size: 892416,
    status: 'expired',
    uploadedAt: '2024-06-01T09:00:00Z',
    expiresAt: '2025-06-01',
    description: 'Utility bill as proof of residence',
    isRequired: true,
    url: '#'
  },
  {
    id: 'DOC-004',
    name: 'W-8BEN_Tax_Form.pdf',
    category: 'tax',
    type: 'pdf',
    size: 512000,
    status: 'approved',
    uploadedAt: '2025-01-15T11:30:00Z',
    expiresAt: '2028-01-15',
    description: 'Tax withholding certificate for non-US investors',
    isRequired: true,
    url: '#'
  },
  {
    id: 'DOC-005',
    name: 'Accredited_Investor_Certificate.pdf',
    category: 'legal',
    type: 'pdf',
    size: 768000,
    status: 'approved',
    uploadedAt: '2025-05-01T16:00:00Z',
    description: 'Accredited investor status verification',
    isRequired: true,
    url: '#'
  },
  {
    id: 'DOC-006',
    name: 'Q4_2025_Investment_Report.pdf',
    category: 'reports',
    type: 'pdf',
    size: 3145728,
    status: 'approved',
    uploadedAt: '2026-01-05T08:00:00Z',
    description: 'Quarterly investment performance report',
    isRequired: false,
    url: '#'
  },
  {
    id: 'DOC-007',
    name: 'Annual_Statement_2025.xlsx',
    category: 'reports',
    type: 'xlsx',
    size: 1024000,
    status: 'approved',
    uploadedAt: '2026-01-10T09:00:00Z',
    description: 'Annual investment statement with detailed breakdown',
    isRequired: false,
    url: '#'
  },
  {
    id: 'DOC-008',
    name: 'Source_of_Funds_Declaration.pdf',
    category: 'kyc',
    type: 'pdf',
    size: 256000,
    status: 'pending',
    uploadedAt: '2026-01-08T12:00:00Z',
    description: 'Declaration of investment fund sources',
    isRequired: true,
    url: '#'
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

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const getFileIcon = (type: Document['type']) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5" />;
    case 'docx':
      return <FileText className="w-5 h-5" />;
    case 'xlsx':
      return <FileText className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

// ============================================
// Main Component
// ============================================

export default function InvestorDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDocuments(MOCK_DOCUMENTS);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories: DocumentCategory[] = [
    {
      id: 'investment',
      name: 'Investment',
      description: 'Contracts and agreements',
      icon: <Building className="w-5 h-5" />,
      count: documents.filter(d => d.category === 'investment').length
    },
    {
      id: 'kyc',
      name: 'KYC',
      description: 'Identity verification',
      icon: <User className="w-5 h-5" />,
      count: documents.filter(d => d.category === 'kyc').length
    },
    {
      id: 'tax',
      name: 'Tax',
      description: 'Tax forms and certificates',
      icon: <FileCheck className="w-5 h-5" />,
      count: documents.filter(d => d.category === 'tax').length
    },
    {
      id: 'legal',
      name: 'Legal',
      description: 'Legal documents',
      icon: <Shield className="w-5 h-5" />,
      count: documents.filter(d => d.category === 'legal').length
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Performance reports',
      icon: <FileText className="w-5 h-5" />,
      count: documents.filter(d => d.category === 'reports').length
    }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'rejected': return <FileWarning className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const stats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'approved').length,
    pending: documents.filter(d => d.status === 'pending').length,
    expired: documents.filter(d => d.status === 'expired').length,
    required: documents.filter(d => d.isRequired && d.status !== 'approved').length
  };

  if (loading) {
    return (
      <div className="documents-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-page">
      {/* Header */}
      <header className="documents-header">
        <div className="header-content">
          <div className="header-title">
            <Folder className="w-8 h-8" />
            <div>
              <h1>Documents & Files</h1>
              <p>Manage your investment documents</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push('/investors/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="documents-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Documents</span>
        </div>
        <div className="stat-card approved">
          <span className="stat-value">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-card expired">
          <span className="stat-value">{stats.expired}</span>
          <span className="stat-label">Expired</span>
        </div>
        {stats.required > 0 && (
          <div className="stat-card required">
            <span className="stat-value">{stats.required}</span>
            <span className="stat-label">Action Required</span>
          </div>
        )}
      </section>

      {/* Alert for action required */}
      {stats.required > 0 && (
        <div className="alert-banner">
          <AlertTriangle className="w-5 h-5" />
          <div className="alert-content">
            <strong>{stats.required} document{stats.required > 1 ? 's' : ''} require your attention</strong>
            <span>Please update or upload the required documents to maintain compliance.</span>
          </div>
        </div>
      )}

      <div className="documents-layout">
        {/* Categories Sidebar */}
        <aside className="categories-sidebar">
          <h3>Categories</h3>
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <Folder className="w-5 h-5" />
            <span>All Documents</span>
            <span className="count">{documents.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon}
              <span>{cat.name}</span>
              <span className="count">{cat.count}</span>
            </button>
          ))}
        </aside>

        {/* Documents List */}
        <main className="documents-main">
          {/* Filters */}
          <div className="documents-filters">
            <div className="search-box">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter className="w-4 h-4" />
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="documents-grid">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`document-card ${doc.status}`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="doc-header">
                  <div className={`doc-icon ${doc.type}`}>
                    {getFileIcon(doc.type)}
                  </div>
                  <span className={`doc-status ${doc.status}`}>
                    {getStatusIcon(doc.status)}
                    {doc.status}
                  </span>
                </div>
                
                <h4 className="doc-name">{doc.name}</h4>
                
                {doc.description && (
                  <p className="doc-description">{doc.description}</p>
                )}
                
                <div className="doc-meta">
                  <span>
                    <Calendar className="w-3 h-3" />
                    {formatDate(doc.uploadedAt)}
                  </span>
                  <span>{formatFileSize(doc.size)}</span>
                </div>
                
                {doc.expiresAt && (
                  <div className={`doc-expiry ${new Date(doc.expiresAt) < new Date() ? 'expired' : ''}`}>
                    <Clock className="w-3 h-3" />
                    Expires: {formatDate(doc.expiresAt)}
                  </div>
                )}
                
                {doc.isRequired && doc.status !== 'approved' && (
                  <div className="doc-required">
                    <AlertTriangle className="w-3 h-3" />
                    Required document
                  </div>
                )}
                
                <div className="doc-actions">
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

          {filteredDocuments.length === 0 && (
            <div className="empty-documents">
              <Folder className="w-12 h-12" />
              <h3>No documents found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </main>
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`modal-icon ${selectedDoc.type}`}>
                {getFileIcon(selectedDoc.type)}
              </div>
              <div>
                <h2>{selectedDoc.name}</h2>
                <span className={`doc-status ${selectedDoc.status}`}>
                  {getStatusIcon(selectedDoc.status)}
                  {selectedDoc.status}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedDoc(null)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {selectedDoc.description && (
                <p className="modal-description">{selectedDoc.description}</p>
              )}
              
              <div className="modal-details">
                <div className="detail-row">
                  <span className="detail-label">Category</span>
                  <span className="detail-value capitalize">{selectedDoc.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">File Size</span>
                  <span className="detail-value">{formatFileSize(selectedDoc.size)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">File Type</span>
                  <span className="detail-value uppercase">{selectedDoc.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Uploaded</span>
                  <span className="detail-value">{formatDate(selectedDoc.uploadedAt)}</span>
                </div>
                {selectedDoc.expiresAt && (
                  <div className="detail-row">
                    <span className="detail-label">Expires</span>
                    <span className={`detail-value ${new Date(selectedDoc.expiresAt) < new Date() ? 'expired' : ''}`}>
                      {formatDate(selectedDoc.expiresAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button className="btn-primary">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button className="modal-close" onClick={() => setUploadModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="upload-zone">
                <Upload className="w-12 h-12" />
                <h3>Drag and drop files here</h3>
                <p>or click to browse</p>
                <span className="upload-formats">
                  Supported: PDF, DOCX, XLSX, PNG, JPG (Max 10MB)
                </span>
              </div>
              
              <div className="upload-category">
                <label>Document Category</label>
                <select>
                  <option value="">Select category...</option>
                  <option value="investment">Investment</option>
                  <option value="kyc">KYC Verification</option>
                  <option value="tax">Tax Documents</option>
                  <option value="legal">Legal</option>
                  <option value="reports">Reports</option>
                </select>
              </div>
              
              <div className="upload-description">
                <label>Description (optional)</label>
                <textarea placeholder="Brief description of the document..." rows={3} />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Upload className="w-4 h-4" /> Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
