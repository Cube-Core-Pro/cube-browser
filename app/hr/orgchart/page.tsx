'use client';

import React, { useState, useCallback } from 'react';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Printer,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  MapPin,
  Mail,
  Phone,
  MoreVertical,
  X,
  Plus,
  Minus,
  Move,
  RefreshCw,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import './orgchart.css';

interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  avatar?: string;
  directReports: number;
  children?: OrgNode[];
  expanded?: boolean;
}

const orgData: OrgNode = {
  id: 'CEO001',
  name: 'John Mitchell',
  position: 'Chief Executive Officer',
  department: 'Executive',
  location: 'San Francisco, CA',
  email: 'john.mitchell@company.com',
  phone: '+1 (555) 000-0001',
  directReports: 8,
  expanded: true,
  children: [
    {
      id: 'CTO001',
      name: 'Sarah Chen',
      position: 'VP of Engineering',
      department: 'Engineering',
      location: 'San Francisco, CA',
      email: 'sarah.chen@company.com',
      phone: '+1 (555) 123-4567',
      directReports: 12,
      expanded: true,
      children: [
        {
          id: 'ENG001',
          name: 'Maria Garcia',
          position: 'Engineering Manager',
          department: 'Engineering',
          location: 'Austin, TX',
          email: 'maria.garcia@company.com',
          phone: '+1 (555) 111-2222',
          directReports: 8,
          expanded: false,
          children: [
            {
              id: 'DEV001',
              name: 'Alex Thompson',
              position: 'Senior Software Engineer',
              department: 'Engineering',
              location: 'Seattle, WA',
              email: 'alex.thompson@company.com',
              phone: '+1 (555) 678-9012',
              directReports: 0,
            },
            {
              id: 'DEV002',
              name: 'Kevin Park',
              position: 'Software Engineer',
              department: 'Engineering',
              location: 'San Francisco, CA',
              email: 'kevin.park@company.com',
              phone: '+1 (555) 333-4444',
              directReports: 0,
            },
          ]
        },
        {
          id: 'ENG002',
          name: 'James Liu',
          position: 'Engineering Manager',
          department: 'Engineering',
          location: 'New York, NY',
          email: 'james.liu@company.com',
          phone: '+1 (555) 222-3333',
          directReports: 6,
          expanded: false,
        },
        {
          id: 'ENG003',
          name: 'Rachel Kim',
          position: 'Principal Engineer',
          department: 'Engineering',
          location: 'Seattle, WA',
          email: 'rachel.kim@company.com',
          phone: '+1 (555) 444-5555',
          directReports: 0,
        }
      ]
    },
    {
      id: 'CPO001',
      name: 'Michael Ross',
      position: 'Head of Product',
      department: 'Product',
      location: 'New York, NY',
      email: 'michael.ross@company.com',
      phone: '+1 (555) 234-5678',
      directReports: 8,
      expanded: false,
      children: [
        {
          id: 'PM001',
          name: 'Diana Martinez',
          position: 'Senior Product Manager',
          department: 'Product',
          location: 'New York, NY',
          email: 'diana.martinez@company.com',
          phone: '+1 (555) 555-6666',
          directReports: 2,
        },
        {
          id: 'PM002',
          name: 'Tom Wilson',
          position: 'Product Manager',
          department: 'Product',
          location: 'Chicago, IL',
          email: 'tom.wilson@company.com',
          phone: '+1 (555) 666-7777',
          directReports: 0,
        }
      ]
    },
    {
      id: 'CDO001',
      name: 'Emma Wilson',
      position: 'Design Director',
      department: 'Design',
      location: 'Los Angeles, CA',
      email: 'emma.wilson@company.com',
      phone: '+1 (555) 345-6789',
      directReports: 6,
      expanded: false,
      children: [
        {
          id: 'DES001',
          name: 'Sophie Martin',
          position: 'Senior Product Designer',
          department: 'Design',
          location: 'Remote',
          email: 'sophie.martin@company.com',
          phone: '+1 (555) 777-8888',
          directReports: 0,
        },
        {
          id: 'DES002',
          name: 'Chris Brown',
          position: 'UX Researcher',
          department: 'Design',
          location: 'Los Angeles, CA',
          email: 'chris.brown@company.com',
          phone: '+1 (555) 888-9999',
          directReports: 0,
        }
      ]
    },
    {
      id: 'CMO001',
      name: 'David Kim',
      position: 'Chief Marketing Officer',
      department: 'Marketing',
      location: 'Chicago, IL',
      email: 'david.kim@company.com',
      phone: '+1 (555) 456-7890',
      directReports: 7,
      expanded: false,
    },
    {
      id: 'CSO001',
      name: 'Jennifer Lee',
      position: 'VP of Sales',
      department: 'Sales',
      location: 'Boston, MA',
      email: 'jennifer.lee@company.com',
      phone: '+1 (555) 567-8901',
      directReports: 15,
      expanded: false,
    },
    {
      id: 'CFO001',
      name: 'Robert Brown',
      position: 'Chief Financial Officer',
      department: 'Finance',
      location: 'New York, NY',
      email: 'robert.brown@company.com',
      phone: '+1 (555) 012-3456',
      directReports: 5,
      expanded: false,
    },
    {
      id: 'CHRO001',
      name: 'Amanda Torres',
      position: 'Chief HR Officer',
      department: 'Human Resources',
      location: 'San Francisco, CA',
      email: 'amanda.torres@company.com',
      phone: '+1 (555) 222-3333',
      directReports: 4,
      expanded: false,
    },
    {
      id: 'COO001',
      name: 'Lisa Wang',
      position: 'Chief Operations Officer',
      department: 'Operations',
      location: 'Austin, TX',
      email: 'lisa.wang@company.com',
      phone: '+1 (555) 333-4444',
      directReports: 8,
      expanded: false,
    }
  ]
};

const departmentColors: Record<string, string> = {
  'Executive': '#8b5cf6',
  'Engineering': '#3b82f6',
  'Product': '#06b6d4',
  'Design': '#ec4899',
  'Marketing': '#f59e0b',
  'Sales': '#10b981',
  'Finance': '#6366f1',
  'Human Resources': '#f43f5e',
  'Operations': '#14b8a6',
};

export default function OrgChartPage() {
  const [orgTree, setOrgTree] = useState<OrgNode>(orgData);
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDepartments, setShowDepartments] = useState(true);

  const toggleNode = useCallback((nodeId: string) => {
    const toggleInTree = (node: OrgNode): OrgNode => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: node.children.map(toggleInTree) };
      }
      return node;
    };
    setOrgTree(prev => toggleInTree(prev));
  }, []);

  const expandAll = () => {
    const expandInTree = (node: OrgNode): OrgNode => ({
      ...node,
      expanded: true,
      children: node.children?.map(expandInTree)
    });
    setOrgTree(expandInTree(orgTree));
  };

  const collapseAll = () => {
    const collapseInTree = (node: OrgNode, isRoot: boolean = true): OrgNode => ({
      ...node,
      expanded: isRoot,
      children: node.children?.map(child => collapseInTree(child, false))
    });
    setOrgTree(collapseInTree(orgTree));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('');
  };

  const countTotalReports = (node: OrgNode): number => {
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + 1 + countTotalReports(child), 0);
  };

  const renderNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const deptColor = departmentColors[node.department] || '#64748b';
    
    return (
      <div key={node.id} className={`org-node-wrapper ${viewMode}`}>
        <div 
          className={`org-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
          style={{ '--dept-color': deptColor } as React.CSSProperties}
          onClick={() => setSelectedNode(node)}
        >
          <div className="node-header">
            <div className="node-avatar" style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}dd)` }}>
              {getInitials(node.name)}
            </div>
            {hasChildren && (
              <button 
                className="expand-btn"
                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
              >
                {node.expanded ? <Minus size={12} /> : <Plus size={12} />}
              </button>
            )}
          </div>
          <div className="node-body">
            <h4 className="node-name">{node.name}</h4>
            <p className="node-position">{node.position}</p>
            <span className="node-department" style={{ color: deptColor }}>{node.department}</span>
          </div>
          {hasChildren && (
            <div className="node-footer">
              <span className="reports-count">
                <Users size={12} />
                {node.directReports} direct
              </span>
            </div>
          )}
        </div>
        
        {hasChildren && node.expanded && (
          <div className={`org-children ${viewMode}`}>
            <div className="connector-line" />
            <div className="children-container">
              {node.children?.map(child => renderNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    if (!selectedNode) return null;
    
    const deptColor = departmentColors[selectedNode.department] || '#64748b';
    const totalReports = countTotalReports(selectedNode);
    
    return (
      <div className="profile-panel">
        <div className="profile-header">
          <h3>Profile Details</h3>
          <button className="close-btn" onClick={() => setSelectedNode(null)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="profile-content">
          <div className="profile-avatar-section">
            <div 
              className="profile-avatar"
              style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}dd)` }}
            >
              {getInitials(selectedNode.name)}
            </div>
            <h2>{selectedNode.name}</h2>
            <p className="profile-position">{selectedNode.position}</p>
            <span className="profile-department" style={{ background: `${deptColor}20`, color: deptColor }}>
              {selectedNode.department}
            </span>
          </div>
          
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{selectedNode.directReports}</span>
              <span className="stat-label">Direct Reports</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">{totalReports}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
          
          <div className="profile-section">
            <h4>Contact Information</h4>
            <div className="contact-list">
              <div className="contact-item">
                <Mail size={16} />
                <span>{selectedNode.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{selectedNode.phone}</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>{selectedNode.location}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="action-btn primary">
              <Mail size={16} />
              Send Email
            </button>
            <button className="action-btn">
              <Users size={16} />
              View Team
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`orgchart-page ${selectedNode ? 'panel-open' : ''}`}>
      <header className="orgchart__header">
        <div className="orgchart__title-section">
          <div className="orgchart__icon">
            <Network size={28} />
          </div>
          <div>
            <h1>Organization Chart</h1>
            <p>Interactive visualization of company structure</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Printer size={16} />
            Print
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="orgchart-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="toolbar-center">
          <div className="zoom-controls">
            <button 
              className="zoom-btn"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button 
              className="zoom-btn"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
            >
              <ZoomIn size={16} />
            </button>
            <button 
              className="zoom-btn"
              onClick={() => setZoom(100)}
            >
              <Maximize2 size={16} />
            </button>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'vertical' ? 'active' : ''}`}
              onClick={() => setViewMode('vertical')}
            >
              <Layers size={16} />
              Vertical
            </button>
            <button 
              className={`view-btn ${viewMode === 'horizontal' ? 'active' : ''}`}
              onClick={() => setViewMode('horizontal')}
            >
              <Move size={16} />
              Horizontal
            </button>
          </div>
        </div>
        
        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={expandAll}>
            <Eye size={16} />
            Expand All
          </button>
          <button className="toolbar-btn" onClick={collapseAll}>
            <EyeOff size={16} />
            Collapse
          </button>
          <button className="toolbar-btn" onClick={() => setShowDepartments(!showDepartments)}>
            <Building2 size={16} />
            Departments
          </button>
        </div>
      </div>

      {/* Department Legend */}
      {showDepartments && (
        <div className="department-legend">
          {Object.entries(departmentColors).map(([dept, color]) => (
            <div key={dept} className="legend-item">
              <span className="legend-dot" style={{ background: color }}></span>
              <span className="legend-label">{dept}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Container */}
      <div className="orgchart-container">
        <div 
          className={`orgchart-canvas ${viewMode}`}
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {renderNode(orgTree)}
        </div>
      </div>

      {/* Profile Panel */}
      {renderProfile()}
    </div>
  );
}
