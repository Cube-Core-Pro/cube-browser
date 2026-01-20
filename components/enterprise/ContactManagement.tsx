'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Building,
  List,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  X,
  Plus,
  Check,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TourProvider, useTour } from '@/components/tour';
import { allContactTourSections } from './tour';
import {
  ContactService,
  ContactListService,
  ContactImportExportService,
  ContactStatsService,
  Contact,
  ContactList,
  ContactFilter,
  PaginatedContacts,
  ContactStats,
  SubscriptionStatus,
  ImportResult,
} from '@/lib/services/contact-service';
import './ContactManagement.css';

// =============================================================================
// Sub-components
// =============================================================================

interface ContactRowProps {
  contact: Contact;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

const ContactRow: React.FC<ContactRowProps> = ({ contact, selected, onSelect, onEdit, onDelete }) => {
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'Subscribed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'Unsubscribed':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Unsubscribed</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'Bounced':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Bounced</Badge>;
      case 'Complained':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Complained</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email;

  return (
    <tr className={`contact-row ${selected ? 'contact-row--selected' : ''}`}>
      <td className="contact-row__checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(contact.id)}
          className="contact-checkbox"
          title="Select contact"
          aria-label={`Select ${fullName}`}
        />
      </td>
      <td className="contact-row__name">
        <div className="contact-info">
          <div className="contact-avatar">
            {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
          </div>
          <div className="contact-details">
            <span className="contact-name">{fullName}</span>
            <span className="contact-email">{contact.email}</span>
          </div>
        </div>
      </td>
      <td className="contact-row__company">
        {contact.company && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building className="h-3 w-3" />
            {contact.company}
          </div>
        )}
      </td>
      <td className="contact-row__status">
        {getStatusBadge(contact.status)}
      </td>
      <td className="contact-row__tags">
        <div className="flex gap-1 flex-wrap">
          {contact.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
          {contact.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">+{contact.tags.length - 3}</Badge>
          )}
        </div>
      </td>
      <td className="contact-row__engagement">
        <div className="engagement-stats">
          <span title="Emails Sent">{contact.email_count} sent</span>
          <span title="Opens">{contact.open_count} opens</span>
        </div>
      </td>
      <td className="contact-row__actions">
        <Button variant="ghost" size="icon" onClick={() => onEdit(contact)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(contact.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

// =============================================================================
// Contact Form Modal
// =============================================================================

interface ContactFormProps {
  contact?: Contact | null;
  lists: ContactList[];
  onSave: (data: ContactFormData) => void;
  onCancel: () => void;
  saving: boolean;
}

interface ContactFormData {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  tags: string[];
  listIds: string[];
  notes: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, lists, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    email: contact?.email || '',
    firstName: contact?.first_name || '',
    lastName: contact?.last_name || '',
    company: contact?.company || '',
    phone: contact?.phone || '',
    tags: contact?.tags || [],
    listIds: contact?.list_ids || [],
    notes: contact?.notes || '',
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleList = (listId: string) => {
    if (formData.listIds.includes(listId)) {
      setFormData({ ...formData, listIds: formData.listIds.filter(l => l !== listId) });
    } else {
      setFormData({ ...formData, listIds: [...formData.listIds, listId] });
    }
  };

  return (
    <div className="contact-form-overlay">
      <div className="contact-form-modal">
        <div className="contact-form-header">
          <h2 className="text-lg font-semibold">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap mt-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lists</label>
            <div className="grid grid-cols-2 gap-2">
              {lists.filter(l => !l.is_default).map(list => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => toggleList(list.id)}
                  className={`p-2 rounded border text-left text-sm ${
                    formData.listIds.includes(list.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.listIds.includes(list.id) && <Check className="h-4 w-4 text-primary" />}
                    <span>{list.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about this contact..."
              className="w-full p-2 border rounded-md min-h-[80px] bg-background"
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.email}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {contact ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// Import Modal
// =============================================================================

interface ImportModalProps {
  lists: ContactList[];
  onImport: (csvData: string, listId?: string) => void;
  onCancel: () => void;
  importing: boolean;
  result: ImportResult | null;
}

const ImportModal: React.FC<ImportModalProps> = ({ lists, onImport, onCancel, importing, result }) => {
  const [csvData, setCsvData] = useState('');
  const [selectedList, setSelectedList] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="contact-form-overlay">
      <div className="contact-form-modal">
        <div className="contact-form-header">
          <h2 className="text-lg font-semibold">Import Contacts</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="contact-form">
          {!result ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">CSV File</label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground">
                  CSV must include an &quot;email&quot; column. Optional: first_name, last_name, company, phone
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Or Paste CSV Data</label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="email,first_name,last_name,company&#10;john@example.com,John,Doe,Acme Inc"
                  className="w-full p-2 border rounded-md min-h-[150px] bg-background font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add to List (Optional)</label>
                <Select value={selectedList} onValueChange={setSelectedList}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No list</SelectItem>
                    {lists.filter(l => !l.is_default).map(list => (
                      <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button
                  onClick={() => onImport(csvData, selectedList || undefined)}
                  disabled={importing || !csvData.trim()}
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-lg ${result.errors.length === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <h3 className="font-medium mb-2">Import Complete</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Rows:</span>
                    <span className="ml-2 font-medium">{result.total}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Imported:</span>
                    <span className="ml-2 font-medium text-green-600">{result.imported}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="ml-2 font-medium text-blue-600">{result.updated}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skipped:</span>
                    <span className="ml-2 font-medium text-yellow-600">{result.skipped}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Completed in {result.duration_ms}ms
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Errors ({result.errors.length})</h4>
                  <div className="max-h-[150px] overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-500 p-2 bg-red-500/10 rounded mb-1">
                        Row {err.row}: {err.email} - {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={onCancel}>Close</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// List Form Modal
// =============================================================================

interface ListFormProps {
  list?: ContactList | null;
  onSave: (name: string, description: string, color: string) => void;
  onCancel: () => void;
  saving: boolean;
}

const ListForm: React.FC<ListFormProps> = ({ list, onSave, onCancel, saving }) => {
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  const [color, setColor] = useState(list?.color || '#3b82f6');

  const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="contact-form-overlay">
      <div className="contact-form-modal contact-form-modal--narrow">
        <div className="contact-form-header">
          <h2 className="text-lg font-semibold">{list ? 'Edit List' : 'Create List'}</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(name, description, color); }} className="contact-form">
          <div className="space-y-2">
            <label className="text-sm font-medium">List Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Newsletter Subscribers"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="People who signed up for our newsletter"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2" role="group" aria-label="Color selection">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full color-picker-btn ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  data-color={c}
                  title={`Select color ${c}`}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {list ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

interface ContactManagementProps {
  onSelectContacts?: (contacts: Contact[]) => void;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({ onSelectContacts }) => {
  return (
    <TourProvider tourId="contacts" sections={allContactTourSections}>
      <ContactManagementContent onSelectContacts={onSelectContacts} />
    </TourProvider>
  );
};

const ContactManagementContent: React.FC<ContactManagementProps> = ({ onSelectContacts }) => {
  // Tour hook
  const { startTour } = useTour();
  
  // Data state
  const [contacts, setContacts] = useState<PaginatedContacts | null>(null);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [_allTags, setAllTags] = useState<string[]>([]); // Reserved for future tag filtering feature
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [listFilter, setListFilter] = useState<string>('default');
  const [page, setPage] = useState(1);
  const perPage = 25;
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  
  // Action state
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: ContactFilter = {
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        list_id: listFilter,
        page,
        per_page: perPage,
      };

      const [contactsData, listsData, statsData, tagsData] = await Promise.all([
        ContactService.getContacts(filter),
        ContactListService.getLists(),
        ContactStatsService.getStats(),
        ContactStatsService.getTags(),
      ]);

      setContacts(contactsData);
      setLists(listsData);
      setStats(statsData);
      setAllTags(tagsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, listFilter, page, perPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    
    if (onSelectContacts) {
      const selectedContacts = contacts?.contacts.filter(c => newSelected.has(c.id)) || [];
      onSelectContacts(selectedContacts);
    }
  };

  const toggleSelectAll = () => {
    if (contacts) {
      if (selectedIds.size === contacts.contacts.length) {
        setSelectedIds(new Set());
        onSelectContacts?.([]);
      } else {
        setSelectedIds(new Set(contacts.contacts.map(c => c.id)));
        onSelectContacts?.(contacts.contacts);
      }
    }
  };

  // Contact handlers
  const handleSaveContact = async (data: ContactFormData) => {
    try {
      setSaving(true);
      if (editingContact) {
        await ContactService.updateContact(editingContact.id, data);
      } else {
        await ContactService.createContact(data);
      }
      setShowContactForm(false);
      setEditingContact(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await ContactService.deleteContact(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;

    try {
      await ContactService.deleteContacts(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contacts');
    }
  };

  // Import/Export handlers
  const handleImport = async (csvData: string, listId?: string) => {
    try {
      setImporting(true);
      const result = await ContactImportExportService.importCsv(csvData, { listId, source: 'import' });
      setImportResult(result);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await ContactImportExportService.exportCsv(
        { list_id: listFilter === 'default' ? undefined : listFilter },
        listFilter === 'default' ? undefined : listFilter
      );
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // List handlers
  const handleSaveList = async (name: string, description: string, color: string) => {
    try {
      setSaving(true);
      if (editingList) {
        await ContactListService.updateList(editingList.id, { name, description, color });
      } else {
        await ContactListService.createList({ name, description, color });
      }
      setShowListForm(false);
      setEditingList(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save list');
    } finally {
      setSaving(false);
    }
  };

  // Handle list deletion
  const handleDeleteList = async (listId: string) => {
    if (!confirm('Delete this list? Contacts will not be deleted.')) return;

    try {
      await ContactListService.deleteList(listId);
      if (listFilter === listId) setListFilter('default');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  };

  return (
    <div className="contact-management">
      {/* Stats Overview */}
      {stats && (
        <div className="contact-stats-grid" data-tour="contact-stats">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_contacts}</p>
                  <p className="text-xs text-muted-foreground">Total Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.subscribed}</p>
                  <p className="text-xs text-muted-foreground">Subscribed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <List className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_lists}</p>
                  <p className="text-xs text-muted-foreground">Lists</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <UserPlus className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contacts_this_month}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="contact-main-grid">
        {/* Sidebar - Lists */}
        <Card className="contact-sidebar" data-tour="lists-panel">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Lists</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowListForm(true)} data-tour="create-list">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 p-2">
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setListFilter(list.id)}
                  className={`w-full p-2 rounded text-left text-sm flex items-center justify-between group ${
                    listFilter === list.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0 list-color-indicator"
                      data-color={list.color || '#6b7280'}
                    />
                    <span className="truncate">{list.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{list.contact_count}</span>
                    {!list.is_default && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setEditingList(list); setShowListForm(true); }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="contact-content" data-tour="contact-list">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4" data-tour="contact-search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search contacts..."
                    className="pl-9 w-[300px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: SubscriptionStatus | 'all') => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Subscribed">Subscribed</SelectItem>
                    <SelectItem value="Unsubscribed">Unsubscribed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} data-tour="import-btn">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} data-tour="export-btn">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setShowContactForm(true)} data-tour="add-contact">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
                <Button variant="ghost" size="sm" onClick={() => startTour()} title="Start guided tour">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between" data-tour="bulk-actions">
                <span className="text-sm">{selectedIds.size} contacts selected</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contacts && contacts.contacts.length > 0 ? (
              <div className="contact-table-wrapper">
                <table className="contact-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === contacts.contacts.length && contacts.contacts.length > 0}
                          onChange={toggleSelectAll}
                          className="contact-checkbox"
                          title="Select all contacts"
                          aria-label="Select all contacts on this page"
                        />
                      </th>
                      <th>Contact</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Tags</th>
                      <th>Engagement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.contacts.map(contact => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        selected={selectedIds.has(contact.id)}
                        onSelect={toggleSelection}
                        onEdit={(c) => { setEditingContact(c); setShowContactForm(true); }}
                        onDelete={handleDeleteContact}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contacts found</p>
                <Button className="mt-4" onClick={() => setShowContactForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            )}

            {/* Pagination */}
            {contacts && contacts.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * perPage) + 1} - {Math.min(page * perPage, contacts.total)} of {contacts.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {contacts.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === contacts.total_pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showContactForm && (
        <ContactForm
          contact={editingContact}
          lists={lists}
          onSave={handleSaveContact}
          onCancel={() => { setShowContactForm(false); setEditingContact(null); }}
          saving={saving}
        />
      )}

      {showImportModal && (
        <ImportModal
          lists={lists}
          onImport={handleImport}
          onCancel={() => { setShowImportModal(false); setImportResult(null); }}
          importing={importing}
          result={importResult}
        />
      )}

      {showListForm && (
        <ListForm
          list={editingList}
          onSave={handleSaveList}
          onCancel={() => { setShowListForm(false); setEditingList(null); }}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ContactManagement;
