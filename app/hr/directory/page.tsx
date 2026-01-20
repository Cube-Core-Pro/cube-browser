'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  Star,
  UserCircle,
  Clock,
  Award,
  GraduationCap,
  Heart,
  Shield,
  X,
  Check,
  MessageSquare,
  Video,
  Globe,
  Linkedin,
  Github
} from 'lucide-react';
import './directory.css';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  location: string;
  manager: string;
  managerId: string;
  hireDate: string;
  status: 'active' | 'onLeave' | 'remote';
  type: 'fullTime' | 'partTime' | 'contractor';
  avatar?: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  timezone: string;
  birthday?: string;
  workAnniversary?: string;
  directReports: number;
  starred: boolean;
}

interface Department {
  id: string;
  name: string;
  headCount: number;
  manager: string;
}

const departments: Department[] = [
  { id: 'eng', name: 'Engineering', headCount: 145, manager: 'Sarah Chen' },
  { id: 'product', name: 'Product', headCount: 32, manager: 'Michael Ross' },
  { id: 'design', name: 'Design', headCount: 24, manager: 'Emma Wilson' },
  { id: 'marketing', name: 'Marketing', headCount: 28, manager: 'David Kim' },
  { id: 'sales', name: 'Sales', headCount: 67, manager: 'Jennifer Lee' },
  { id: 'hr', name: 'Human Resources', headCount: 18, manager: 'Amanda Torres' },
  { id: 'finance', name: 'Finance', headCount: 22, manager: 'Robert Brown' },
  { id: 'operations', name: 'Operations', headCount: 35, manager: 'Lisa Wang' },
  { id: 'customer', name: 'Customer Success', headCount: 42, manager: 'James Miller' },
  { id: 'legal', name: 'Legal', headCount: 8, manager: 'Patricia Davis' },
];

const employees: Employee[] = [
  {
    id: 'EMP001',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'VP of Engineering',
    location: 'San Francisco, CA',
    manager: 'CEO',
    managerId: '',
    hireDate: '2019-03-15',
    status: 'active',
    type: 'fullTime',
    skills: ['Leadership', 'System Design', 'Python', 'Go'],
    languages: ['English', 'Mandarin'],
    certifications: ['AWS Solutions Architect', 'PMP'],
    timezone: 'PST (UTC-8)',
    birthday: '1985-06-15',
    workAnniversary: '2024-03-15',
    directReports: 12,
    starred: true
  },
  {
    id: 'EMP002',
    firstName: 'Michael',
    lastName: 'Ross',
    email: 'michael.ross@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Product',
    position: 'Head of Product',
    location: 'New York, NY',
    manager: 'CEO',
    managerId: '',
    hireDate: '2020-01-10',
    status: 'active',
    type: 'fullTime',
    skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis'],
    languages: ['English', 'Spanish'],
    certifications: ['CSPO', 'SAFe Agilist'],
    timezone: 'EST (UTC-5)',
    directReports: 8,
    starred: false
  },
  {
    id: 'EMP003',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@company.com',
    phone: '+1 (555) 345-6789',
    department: 'Design',
    position: 'Design Director',
    location: 'Los Angeles, CA',
    manager: 'CEO',
    managerId: '',
    hireDate: '2020-06-22',
    status: 'remote',
    type: 'fullTime',
    skills: ['UI/UX', 'Design Systems', 'Figma', 'User Research'],
    languages: ['English', 'French'],
    certifications: ['Google UX Certificate'],
    timezone: 'PST (UTC-8)',
    directReports: 6,
    starred: true
  },
  {
    id: 'EMP004',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@company.com',
    phone: '+1 (555) 456-7890',
    department: 'Marketing',
    position: 'CMO',
    location: 'Chicago, IL',
    manager: 'CEO',
    managerId: '',
    hireDate: '2019-08-01',
    status: 'active',
    type: 'fullTime',
    skills: ['Brand Strategy', 'Digital Marketing', 'Analytics', 'Content'],
    languages: ['English', 'Korean'],
    certifications: ['Google Analytics', 'HubSpot'],
    timezone: 'CST (UTC-6)',
    directReports: 7,
    starred: false
  },
  {
    id: 'EMP005',
    firstName: 'Jennifer',
    lastName: 'Lee',
    email: 'jennifer.lee@company.com',
    phone: '+1 (555) 567-8901',
    department: 'Sales',
    position: 'VP of Sales',
    location: 'Boston, MA',
    manager: 'CEO',
    managerId: '',
    hireDate: '2018-11-15',
    status: 'active',
    type: 'fullTime',
    skills: ['Enterprise Sales', 'Negotiation', 'CRM', 'Team Leadership'],
    languages: ['English'],
    certifications: ['Salesforce Admin'],
    timezone: 'EST (UTC-5)',
    directReports: 15,
    starred: false
  },
  {
    id: 'EMP006',
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex.thompson@company.com',
    phone: '+1 (555) 678-9012',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    location: 'Seattle, WA',
    manager: 'Sarah Chen',
    managerId: 'EMP001',
    hireDate: '2021-02-28',
    status: 'active',
    type: 'fullTime',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    languages: ['English'],
    certifications: ['AWS Developer Associate'],
    timezone: 'PST (UTC-8)',
    directReports: 0,
    starred: false
  },
  {
    id: 'EMP007',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@company.com',
    phone: '+1 (555) 789-0123',
    department: 'Engineering',
    position: 'Engineering Manager',
    location: 'Austin, TX',
    manager: 'Sarah Chen',
    managerId: 'EMP001',
    hireDate: '2020-09-14',
    status: 'active',
    type: 'fullTime',
    skills: ['Team Management', 'Java', 'Kubernetes', 'CI/CD'],
    languages: ['English', 'Spanish', 'Portuguese'],
    certifications: ['CKA', 'AWS DevOps'],
    timezone: 'CST (UTC-6)',
    directReports: 8,
    starred: true
  },
  {
    id: 'EMP008',
    firstName: 'James',
    lastName: 'Williams',
    email: 'james.williams@company.com',
    phone: '+1 (555) 890-1234',
    department: 'Finance',
    position: 'Financial Analyst',
    location: 'New York, NY',
    manager: 'Robert Brown',
    managerId: 'EMP010',
    hireDate: '2022-04-18',
    status: 'active',
    type: 'fullTime',
    skills: ['Financial Modeling', 'Excel', 'SQL', 'Tableau'],
    languages: ['English'],
    certifications: ['CFA Level II'],
    timezone: 'EST (UTC-5)',
    directReports: 0,
    starred: false
  },
  {
    id: 'EMP009',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@company.com',
    phone: '+1 (555) 901-2345',
    department: 'Design',
    position: 'Senior Product Designer',
    location: 'Remote',
    manager: 'Emma Wilson',
    managerId: 'EMP003',
    hireDate: '2021-07-12',
    status: 'remote',
    type: 'fullTime',
    skills: ['Product Design', 'Prototyping', 'User Testing', 'Design Systems'],
    languages: ['English', 'German'],
    certifications: [],
    timezone: 'CET (UTC+1)',
    directReports: 0,
    starred: false
  },
  {
    id: 'EMP010',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@company.com',
    phone: '+1 (555) 012-3456',
    department: 'Finance',
    position: 'CFO',
    location: 'New York, NY',
    manager: 'CEO',
    managerId: '',
    hireDate: '2018-05-20',
    status: 'active',
    type: 'fullTime',
    skills: ['Financial Planning', 'M&A', 'Investor Relations', 'Risk Management'],
    languages: ['English'],
    certifications: ['CPA', 'CFA'],
    timezone: 'EST (UTC-5)',
    directReports: 5,
    starred: false
  },
  {
    id: 'EMP011',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@company.com',
    phone: '+1 (555) 111-2222',
    department: 'Human Resources',
    position: 'HR Business Partner',
    location: 'San Francisco, CA',
    manager: 'Amanda Torres',
    managerId: 'EMP012',
    hireDate: '2021-11-08',
    status: 'onLeave',
    type: 'fullTime',
    skills: ['Employee Relations', 'Talent Management', 'HRIS', 'Coaching'],
    languages: ['English', 'Japanese'],
    certifications: ['SHRM-CP'],
    timezone: 'PST (UTC-8)',
    directReports: 0,
    starred: false
  },
  {
    id: 'EMP012',
    firstName: 'Amanda',
    lastName: 'Torres',
    email: 'amanda.torres@company.com',
    phone: '+1 (555) 222-3333',
    department: 'Human Resources',
    position: 'CHRO',
    location: 'San Francisco, CA',
    manager: 'CEO',
    managerId: '',
    hireDate: '2019-01-15',
    status: 'active',
    type: 'fullTime',
    skills: ['HR Strategy', 'Culture Building', 'Compensation', 'L&D'],
    languages: ['English', 'Spanish'],
    certifications: ['SHRM-SCP', 'SPHR'],
    timezone: 'PST (UTC-8)',
    directReports: 4,
    starred: true
  },
];

export default function DirectoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchTerm, selectedDepartment, selectedStatus]);

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active"><span className="status-dot"></span>Active</span>;
      case 'onLeave':
        return <span className="status-badge leave"><span className="status-dot"></span>On Leave</span>;
      case 'remote':
        return <span className="status-badge remote"><span className="status-dot"></span>Remote</span>;
      default:
        return null;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderEmployeeCard = (employee: Employee) => (
    <div 
      key={employee.id} 
      className="employee-card"
      onClick={() => setSelectedEmployee(employee)}
    >
      <div className="card-header">
        <div className="employee-avatar">
          {employee.avatar ? (
            <img src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
          ) : (
            <span className="avatar-initials">{getInitials(employee.firstName, employee.lastName)}</span>
          )}
          <span className={`online-indicator ${employee.status}`}></span>
        </div>
        <button 
          className={`star-btn ${employee.starred ? 'starred' : ''}`}
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Star size={14} />
        </button>
      </div>
      
      <div className="card-body">
        <h4 className="employee-name">{employee.firstName} {employee.lastName}</h4>
        <p className="employee-position">{employee.position}</p>
        <p className="employee-department">{employee.department}</p>
      </div>
      
      <div className="card-meta">
        <span className="meta-item">
          <MapPin size={12} />
          {employee.location}
        </span>
        <span className="meta-item">
          <Mail size={12} />
          {employee.email.split('@')[0]}
        </span>
      </div>
      
      <div className="card-footer">
        {getStatusBadge(employee.status)}
        <div className="quick-actions">
          <button className="quick-action-btn" title="Send Email">
            <Mail size={14} />
          </button>
          <button className="quick-action-btn" title="Message">
            <MessageSquare size={14} />
          </button>
          <button className="quick-action-btn" title="Video Call">
            <Video size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmployeeRow = (employee: Employee) => (
    <div 
      key={employee.id} 
      className="employee-row"
      onClick={() => setSelectedEmployee(employee)}
    >
      <div className="col-employee">
        <div className="employee-avatar small">
          <span className="avatar-initials">{getInitials(employee.firstName, employee.lastName)}</span>
          <span className={`online-indicator ${employee.status}`}></span>
        </div>
        <div className="employee-info">
          <span className="employee-name">{employee.firstName} {employee.lastName}</span>
          <span className="employee-email">{employee.email}</span>
        </div>
      </div>
      <span className="col-position">{employee.position}</span>
      <span className="col-department">{employee.department}</span>
      <span className="col-location">{employee.location}</span>
      <span className="col-status">{getStatusBadge(employee.status)}</span>
      <div className="col-actions">
        <button className="action-btn" title="Email">
          <Mail size={14} />
        </button>
        <button className="action-btn" title="Message">
          <MessageSquare size={14} />
        </button>
        <button className="action-btn" title="More">
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );

  const renderEmployeeProfile = () => {
    if (!selectedEmployee) return null;
    
    return (
      <div className="profile-panel">
        <div className="profile-header">
          <button className="close-btn" onClick={() => setSelectedEmployee(null)}>
            <X size={20} />
          </button>
          <div className="profile-actions">
            <button className="action-btn" title="Edit">
              <Edit size={16} />
            </button>
            <button className="action-btn" title="More">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        
        <div className="profile-main">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <span className="avatar-initials large">
                {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
              </span>
              <span className={`online-indicator large ${selectedEmployee.status}`}></span>
            </div>
            <h2>{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
            <p className="profile-position">{selectedEmployee.position}</p>
            {getStatusBadge(selectedEmployee.status)}
          </div>
          
          <div className="profile-contact-actions">
            <button className="contact-btn">
              <Mail size={18} />
              Email
            </button>
            <button className="contact-btn">
              <MessageSquare size={18} />
              Message
            </button>
            <button className="contact-btn primary">
              <Video size={18} />
              Video Call
            </button>
          </div>
          
          <div className="profile-section">
            <h3>Contact Information</h3>
            <div className="info-list">
              <div className="info-item">
                <Mail size={16} />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-value">{selectedEmployee.email}</span>
                </div>
              </div>
              <div className="info-item">
                <Phone size={16} />
                <div>
                  <span className="info-label">Phone</span>
                  <span className="info-value">{selectedEmployee.phone}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={16} />
                <div>
                  <span className="info-label">Location</span>
                  <span className="info-value">{selectedEmployee.location}</span>
                </div>
              </div>
              <div className="info-item">
                <Globe size={16} />
                <div>
                  <span className="info-label">Timezone</span>
                  <span className="info-value">{selectedEmployee.timezone}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Work Information</h3>
            <div className="info-list">
              <div className="info-item">
                <Building2 size={16} />
                <div>
                  <span className="info-label">Department</span>
                  <span className="info-value">{selectedEmployee.department}</span>
                </div>
              </div>
              <div className="info-item">
                <Briefcase size={16} />
                <div>
                  <span className="info-label">Position</span>
                  <span className="info-value">{selectedEmployee.position}</span>
                </div>
              </div>
              <div className="info-item">
                <UserCircle size={16} />
                <div>
                  <span className="info-label">Reports To</span>
                  <span className="info-value">{selectedEmployee.manager || 'N/A'}</span>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={16} />
                <div>
                  <span className="info-label">Start Date</span>
                  <span className="info-value">{formatDate(selectedEmployee.hireDate)}</span>
                </div>
              </div>
              {selectedEmployee.directReports > 0 && (
                <div className="info-item">
                  <Users size={16} />
                  <div>
                    <span className="info-label">Direct Reports</span>
                    <span className="info-value">{selectedEmployee.directReports} employees</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Skills & Expertise</h3>
            <div className="skills-list">
              {selectedEmployee.skills.map((skill, index) => (
                <span key={index} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Languages</h3>
            <div className="languages-list">
              {selectedEmployee.languages.map((lang, index) => (
                <span key={index} className="language-badge">{lang}</span>
              ))}
            </div>
          </div>
          
          {selectedEmployee.certifications.length > 0 && (
            <div className="profile-section">
              <h3>Certifications</h3>
              <div className="certifications-list">
                {selectedEmployee.certifications.map((cert, index) => (
                  <div key={index} className="certification-item">
                    <Award size={16} />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`directory-page ${selectedEmployee ? 'panel-open' : ''}`}>
      <header className="directory__header">
        <div className="directory__title-section">
          <div className="directory__icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Employee Directory</h1>
            <p>Find and connect with colleagues across the organization</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{employees.length}</span>
          <span className="stat-label">Total Employees</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{employees.filter(e => e.status === 'active').length}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{employees.filter(e => e.status === 'remote').length}</span>
          <span className="stat-label">Remote</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{employees.filter(e => e.status === 'onLeave').length}</span>
          <span className="stat-label">On Leave</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{departments.length}</span>
          <span className="stat-label">Departments</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="directory-toolbar">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text"
              placeholder="Search by name, email, position, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="filter-section">
          <select 
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="remote">Remote</option>
            <option value="onLeave">On Leave</option>
          </select>
          
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            More Filters
          </button>
        </div>
        
        <div className="view-section">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
      </div>

      {/* Main Content */}
      <div className="directory-content">
        <div className="employees-container">
          {viewMode === 'grid' ? (
            <div className="employees-grid">
              {filteredEmployees.map(employee => renderEmployeeCard(employee))}
            </div>
          ) : (
            <div className="employees-list">
              <div className="list-header">
                <span className="col-employee">Employee</span>
                <span className="col-position">Position</span>
                <span className="col-department">Department</span>
                <span className="col-location">Location</span>
                <span className="col-status">Status</span>
                <span className="col-actions">Actions</span>
              </div>
              {filteredEmployees.map(employee => renderEmployeeRow(employee))}
            </div>
          )}
        </div>
        
        {/* Profile Panel */}
        {renderEmployeeProfile()}
      </div>
    </div>
  );
}
