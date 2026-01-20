// Contact Management Service for CUBE Nexum
// ==========================================
// Frontend service for managing email contacts, lists, and segments

import { invoke } from '@tauri-apps/api/core';

// =============================================================================
// Types & Interfaces
// =============================================================================

export type SubscriptionStatus = 
  | 'Subscribed' 
  | 'Unsubscribed' 
  | 'Pending' 
  | 'Bounced' 
  | 'Complained';

export interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  tags: string[];
  custom_fields: Record<string, string>;
  status: SubscriptionStatus;
  source: string;
  list_ids: string[];
  created_at: string;
  updated_at: string;
  last_email_sent: string | null;
  last_email_opened: string | null;
  last_email_clicked: string | null;
  email_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  notes: string | null;
}

export interface ContactList {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  color: string | null;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentRule[];
  rule_operator: 'And' | 'Or';
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  field: string;
  operator: RuleComparison;
  value: string;
}

export type RuleComparison = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface ContactFilter {
  search?: string;
  status?: SubscriptionStatus;
  list_id?: string;
  tags?: string[];
  source?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedContacts {
  contacts: Contact[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  duration_ms: number;
}

export interface ImportError {
  row: number;
  email: string;
  error: string;
}

export interface ContactStats {
  total_contacts: number;
  subscribed: number;
  unsubscribed: number;
  bounced: number;
  pending: number;
  total_lists: number;
  total_segments: number;
  contacts_this_month: number;
}

// =============================================================================
// Contact Operations
// =============================================================================

export const ContactService = {
  /**
   * Get contacts with optional filtering and pagination
   */
  async getContacts(filter?: ContactFilter): Promise<PaginatedContacts> {
    return invoke<PaginatedContacts>('contacts_get_all', { filter });
  },

  /**
   * Get a single contact by ID
   */
  async getContact(contactId: string): Promise<Contact> {
    return invoke<Contact>('contacts_get', { contactId });
  },

  /**
   * Get a contact by email
   */
  async getContactByEmail(email: string): Promise<Contact | null> {
    return invoke<Contact | null>('contacts_get_by_email', { email });
  },

  /**
   * Create a new contact
   */
  async createContact(params: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    tags?: string[];
    listIds?: string[];
    source?: string;
    customFields?: Record<string, string>;
  }): Promise<Contact> {
    return invoke<Contact>('contacts_create', {
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      company: params.company,
      phone: params.phone,
      tags: params.tags,
      list_ids: params.listIds,
      source: params.source,
      custom_fields: params.customFields,
    });
  },

  /**
   * Update an existing contact
   */
  async updateContact(contactId: string, params: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    tags?: string[];
    listIds?: string[];
    status?: string;
    customFields?: Record<string, string>;
    notes?: string;
  }): Promise<Contact> {
    return invoke<Contact>('contacts_update', {
      contact_id: contactId,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      company: params.company,
      phone: params.phone,
      tags: params.tags,
      list_ids: params.listIds,
      status: params.status,
      custom_fields: params.customFields,
      notes: params.notes,
    });
  },

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<void> {
    return invoke('contacts_delete', { contactId });
  },

  /**
   * Delete multiple contacts
   */
  async deleteContacts(contactIds: string[]): Promise<number> {
    return invoke<number>('contacts_delete_bulk', { contactIds });
  },

  /**
   * Add tags to contacts
   */
  async addTags(contactIds: string[], tags: string[]): Promise<number> {
    return invoke<number>('contacts_add_tags', { contactIds, tags });
  },

  /**
   * Remove tags from contacts
   */
  async removeTags(contactIds: string[], tags: string[]): Promise<number> {
    return invoke<number>('contacts_remove_tags', { contactIds, tags });
  },

  /**
   * Add contacts to lists
   */
  async addToLists(contactIds: string[], listIds: string[]): Promise<number> {
    return invoke<number>('contacts_add_to_lists', { contactIds, listIds });
  },

  /**
   * Remove contacts from lists
   */
  async removeFromLists(contactIds: string[], listIds: string[]): Promise<number> {
    return invoke<number>('contacts_remove_from_lists', { contactIds, listIds });
  },

  /**
   * Update contact engagement (for email tracking)
   */
  async updateEngagement(email: string, params: {
    sent?: boolean;
    opened?: boolean;
    clicked?: boolean;
    bounced?: boolean;
  }): Promise<void> {
    return invoke('contacts_update_engagement', {
      email,
      sent: params.sent,
      opened: params.opened,
      clicked: params.clicked,
      bounced: params.bounced,
    });
  },
};

// =============================================================================
// List Operations
// =============================================================================

export const ContactListService = {
  /**
   * Get all contact lists
   */
  async getLists(): Promise<ContactList[]> {
    return invoke<ContactList[]>('contacts_get_lists');
  },

  /**
   * Get a single list
   */
  async getList(listId: string): Promise<ContactList> {
    return invoke<ContactList>('contacts_get_list', { listId });
  },

  /**
   * Create a new list
   */
  async createList(params: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<ContactList> {
    return invoke<ContactList>('contacts_create_list', {
      name: params.name,
      description: params.description,
      color: params.color,
    });
  },

  /**
   * Update a list
   */
  async updateList(listId: string, params: {
    name?: string;
    description?: string;
    color?: string;
  }): Promise<ContactList> {
    return invoke<ContactList>('contacts_update_list', {
      list_id: listId,
      name: params.name,
      description: params.description,
      color: params.color,
    });
  },

  /**
   * Delete a list
   */
  async deleteList(listId: string): Promise<void> {
    return invoke('contacts_delete_list', { listId });
  },
};

// =============================================================================
// Segment Operations
// =============================================================================

export const SegmentService = {
  /**
   * Get all segments
   */
  async getSegments(): Promise<Segment[]> {
    return invoke<Segment[]>('contacts_get_segments');
  },

  /**
   * Create a segment
   */
  async createSegment(params: {
    name: string;
    description?: string;
    rules: SegmentRule[];
    ruleOperator: 'and' | 'or';
  }): Promise<Segment> {
    return invoke<Segment>('contacts_create_segment', {
      name: params.name,
      description: params.description,
      rules: params.rules,
      rule_operator: params.ruleOperator,
    });
  },

  /**
   * Get contacts matching a segment
   */
  async getSegmentContacts(segmentId: string): Promise<Contact[]> {
    return invoke<Contact[]>('contacts_get_segment_contacts', { segmentId });
  },
};

// =============================================================================
// Import/Export Operations
// =============================================================================

export const ContactImportExportService = {
  /**
   * Import contacts from CSV
   */
  async importCsv(csvData: string, params?: {
    listId?: string;
    source?: string;
  }): Promise<ImportResult> {
    return invoke<ImportResult>('contacts_import_csv', {
      csv_data: csvData,
      list_id: params?.listId,
      source: params?.source,
    });
  },

  /**
   * Export contacts to CSV
   */
  async exportCsv(filter?: ContactFilter, listId?: string): Promise<string> {
    return invoke<string>('contacts_export_csv', { filter, list_id: listId });
  },
};

// =============================================================================
// Statistics
// =============================================================================

export const ContactStatsService = {
  /**
   * Get contact statistics
   */
  async getStats(): Promise<ContactStats> {
    return invoke<ContactStats>('contacts_get_stats');
  },

  /**
   * Get all unique tags
   */
  async getTags(): Promise<string[]> {
    return invoke<string[]>('contacts_get_tags');
  },
};

// =============================================================================
// Combined Export
// =============================================================================

export const Contacts = {
  ...ContactService,
  Lists: ContactListService,
  Segments: SegmentService,
  ImportExport: ContactImportExportService,
  Stats: ContactStatsService,
};

export default Contacts;
