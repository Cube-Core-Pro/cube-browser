// Contact Management Service for CUBE Nexum
// ==========================================
// Handles email contacts, lists, segmentation, and contact data management

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use chrono::{DateTime, Utc};
use uuid::Uuid;

// =============================================================================
// Data Structures
// =============================================================================

/// Contact subscription status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SubscriptionStatus {
    Subscribed,
    Unsubscribed,
    Pending,
    Bounced,
    Complained,
}

impl Default for SubscriptionStatus {
    fn default() -> Self {
        SubscriptionStatus::Subscribed
    }
}

/// Email contact
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub company: Option<String>,
    pub phone: Option<String>,
    pub tags: Vec<String>,
    pub custom_fields: HashMap<String, String>,
    pub status: SubscriptionStatus,
    pub source: String,
    pub list_ids: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_email_sent: Option<String>,
    pub last_email_opened: Option<String>,
    pub last_email_clicked: Option<String>,
    pub email_count: u32,
    pub open_count: u32,
    pub click_count: u32,
    pub bounce_count: u32,
    pub notes: Option<String>,
}

impl Contact {
    pub fn new(email: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            email,
            first_name: None,
            last_name: None,
            company: None,
            phone: None,
            tags: Vec::new(),
            custom_fields: HashMap::new(),
            status: SubscriptionStatus::Subscribed,
            source: "manual".to_string(),
            list_ids: Vec::new(),
            created_at: now.clone(),
            updated_at: now,
            last_email_sent: None,
            last_email_opened: None,
            last_email_clicked: None,
            email_count: 0,
            open_count: 0,
            click_count: 0,
            bounce_count: 0,
            notes: None,
        }
    }

    pub fn full_name(&self) -> String {
        match (&self.first_name, &self.last_name) {
            (Some(first), Some(last)) => format!("{} {}", first, last),
            (Some(first), None) => first.clone(),
            (None, Some(last)) => last.clone(),
            (None, None) => self.email.clone(),
        }
    }
}

/// Contact list for organizing contacts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactList {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub contact_count: u32,
    pub created_at: String,
    pub updated_at: String,
    pub is_default: bool,
    pub color: Option<String>,
}

impl ContactList {
    pub fn new(name: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            contact_count: 0,
            created_at: now.clone(),
            updated_at: now,
            is_default: false,
            color: None,
        }
    }
}

/// Segment for dynamic contact grouping based on rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub rules: Vec<SegmentRule>,
    pub rule_operator: RuleOperator,
    pub contact_count: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentRule {
    pub field: String,
    pub operator: RuleComparison,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RuleOperator {
    And,
    Or,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RuleComparison {
    Equals,
    NotEquals,
    Contains,
    NotContains,
    StartsWith,
    EndsWith,
    GreaterThan,
    LessThan,
    IsEmpty,
    IsNotEmpty,
}

/// Import result for bulk operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub total: u32,
    pub imported: u32,
    pub updated: u32,
    pub skipped: u32,
    pub errors: Vec<ImportError>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportError {
    pub row: u32,
    pub email: String,
    pub error: String,
}

/// Export format options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Csv,
    Json,
    Excel,
}

/// Contact service statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactStats {
    pub total_contacts: u32,
    pub subscribed: u32,
    pub unsubscribed: u32,
    pub bounced: u32,
    pub pending: u32,
    pub total_lists: u32,
    pub total_segments: u32,
    pub contacts_this_month: u32,
}

/// Contact filter options
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContactFilter {
    pub search: Option<String>,
    pub status: Option<SubscriptionStatus>,
    pub list_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub source: Option<String>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

/// Paginated response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedContacts {
    pub contacts: Vec<Contact>,
    pub total: u32,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

// =============================================================================
// Contact Service State
// =============================================================================

pub struct ContactServiceState {
    contacts: Mutex<HashMap<String, Contact>>,
    lists: Mutex<HashMap<String, ContactList>>,
    segments: Mutex<HashMap<String, Segment>>,
}

impl Default for ContactServiceState {
    fn default() -> Self {
        Self::new()
    }
}

impl ContactServiceState {
    pub fn new() -> Self {
        let mut lists = HashMap::new();
        
        // Create default "All Contacts" list
        let default_list = ContactList {
            id: "default".to_string(),
            name: "All Contacts".to_string(),
            description: Some("Default list containing all contacts".to_string()),
            contact_count: 0,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
            is_default: true,
            color: Some("#3b82f6".to_string()),
        };
        lists.insert("default".to_string(), default_list);

        Self {
            contacts: Mutex::new(HashMap::new()),
            lists: Mutex::new(lists),
            segments: Mutex::new(HashMap::new()),
        }
    }

    // =========================================================================
    // Contact Operations
    // =========================================================================

    /// Get all contacts with optional filtering and pagination
    pub fn get_contacts(&self, filter: ContactFilter) -> Result<PaginatedContacts, String> {
        let contacts_guard = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut contacts: Vec<Contact> = contacts_guard.values().cloned().collect();

        // Apply filters
        if let Some(search) = &filter.search {
            let search_lower = search.to_lowercase();
            contacts.retain(|c| {
                c.email.to_lowercase().contains(&search_lower) ||
                c.first_name.as_ref().map(|n| n.to_lowercase().contains(&search_lower)).unwrap_or(false) ||
                c.last_name.as_ref().map(|n| n.to_lowercase().contains(&search_lower)).unwrap_or(false) ||
                c.company.as_ref().map(|n| n.to_lowercase().contains(&search_lower)).unwrap_or(false)
            });
        }

        if let Some(status) = &filter.status {
            contacts.retain(|c| &c.status == status);
        }

        if let Some(list_id) = &filter.list_id {
            if list_id != "default" {
                contacts.retain(|c| c.list_ids.contains(list_id));
            }
        }

        if let Some(tags) = &filter.tags {
            if !tags.is_empty() {
                contacts.retain(|c| tags.iter().any(|t| c.tags.contains(t)));
            }
        }

        if let Some(source) = &filter.source {
            contacts.retain(|c| &c.source == source);
        }

        // Sort
        let sort_by = filter.sort_by.unwrap_or_else(|| "created_at".to_string());
        let sort_order = filter.sort_order.unwrap_or_else(|| "desc".to_string());
        
        contacts.sort_by(|a, b| {
            let cmp = match sort_by.as_str() {
                "email" => a.email.cmp(&b.email),
                "first_name" => a.first_name.cmp(&b.first_name),
                "last_name" => a.last_name.cmp(&b.last_name),
                "company" => a.company.cmp(&b.company),
                "updated_at" => a.updated_at.cmp(&b.updated_at),
                _ => a.created_at.cmp(&b.created_at),
            };
            if sort_order == "asc" { cmp } else { cmp.reverse() }
        });

        // Pagination
        let total = contacts.len() as u32;
        let page = filter.page.unwrap_or(1).max(1);
        let per_page = filter.per_page.unwrap_or(50).min(500);
        let total_pages = (total + per_page - 1) / per_page;
        
        let start = ((page - 1) * per_page) as usize;
        let end = (start + per_page as usize).min(contacts.len());
        
        let paginated_contacts = if start < contacts.len() {
            contacts[start..end].to_vec()
        } else {
            Vec::new()
        };

        Ok(PaginatedContacts {
            contacts: paginated_contacts,
            total,
            page,
            per_page,
            total_pages,
        })
    }

    /// Get a single contact by ID
    pub fn get_contact(&self, contact_id: &str) -> Result<Contact, String> {
        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        contacts.get(contact_id)
            .cloned()
            .ok_or_else(|| format!("Contact not found: {}", contact_id))
    }

    /// Get contact by email
    pub fn get_contact_by_email(&self, email: &str) -> Result<Option<Contact>, String> {
        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let email_lower = email.to_lowercase();
        Ok(contacts.values()
            .find(|c| c.email.to_lowercase() == email_lower)
            .cloned())
    }

    /// Create a new contact
    pub fn create_contact(&self, 
        email: String, 
        first_name: Option<String>,
        last_name: Option<String>,
        company: Option<String>,
        phone: Option<String>,
        tags: Option<Vec<String>>,
        list_ids: Option<Vec<String>>,
        source: Option<String>,
        custom_fields: Option<HashMap<String, String>>,
    ) -> Result<Contact, String> {
        // Validate email
        if !email.contains('@') || email.len() < 5 {
            return Err("Invalid email address".to_string());
        }

        // Check for duplicate
        if let Ok(Some(_)) = self.get_contact_by_email(&email) {
            return Err(format!("Contact with email {} already exists", email));
        }

        let mut contact = Contact::new(email);
        contact.first_name = first_name;
        contact.last_name = last_name;
        contact.company = company;
        contact.phone = phone;
        contact.tags = tags.unwrap_or_default();
        contact.list_ids = list_ids.unwrap_or_default();
        contact.source = source.unwrap_or_else(|| "manual".to_string());
        contact.custom_fields = custom_fields.unwrap_or_default();

        let contact_id = contact.id.clone();
        let list_ids_to_update = contact.list_ids.clone();

        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        contacts.insert(contact_id.clone(), contact.clone());
        
        drop(contacts);

        // Update list counts
        self.update_list_counts(&list_ids_to_update)?;

        log::info!("Created contact: {} ({})", contact.email, contact_id);
        Ok(contact)
    }

    /// Update an existing contact
    pub fn update_contact(&self, 
        contact_id: &str,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
        company: Option<String>,
        phone: Option<String>,
        tags: Option<Vec<String>>,
        list_ids: Option<Vec<String>>,
        status: Option<SubscriptionStatus>,
        custom_fields: Option<HashMap<String, String>>,
        notes: Option<String>,
    ) -> Result<Contact, String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let contact = contacts.get_mut(contact_id)
            .ok_or_else(|| format!("Contact not found: {}", contact_id))?;

        let old_list_ids = contact.list_ids.clone();

        if let Some(email) = email {
            if !email.contains('@') || email.len() < 5 {
                return Err("Invalid email address".to_string());
            }
            contact.email = email;
        }
        if let Some(first_name) = first_name {
            contact.first_name = Some(first_name);
        }
        if let Some(last_name) = last_name {
            contact.last_name = Some(last_name);
        }
        if let Some(company) = company {
            contact.company = Some(company);
        }
        if let Some(phone) = phone {
            contact.phone = Some(phone);
        }
        if let Some(tags) = tags {
            contact.tags = tags;
        }
        if let Some(list_ids) = list_ids {
            contact.list_ids = list_ids;
        }
        if let Some(status) = status {
            contact.status = status;
        }
        if let Some(custom_fields) = custom_fields {
            contact.custom_fields = custom_fields;
        }
        if let Some(notes) = notes {
            contact.notes = Some(notes);
        }

        contact.updated_at = Utc::now().to_rfc3339();
        
        let updated_contact = contact.clone();
        let new_list_ids = updated_contact.list_ids.clone();
        
        drop(contacts);

        // Update list counts if lists changed
        if old_list_ids != new_list_ids {
            let mut all_lists: Vec<String> = old_list_ids;
            all_lists.extend(new_list_ids);
            all_lists.sort();
            all_lists.dedup();
            self.update_list_counts(&all_lists)?;
        }

        log::info!("Updated contact: {}", contact_id);
        Ok(updated_contact)
    }

    /// Delete a contact
    pub fn delete_contact(&self, contact_id: &str) -> Result<(), String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let contact = contacts.remove(contact_id)
            .ok_or_else(|| format!("Contact not found: {}", contact_id))?;
        
        let list_ids = contact.list_ids.clone();
        drop(contacts);

        // Update list counts
        self.update_list_counts(&list_ids)?;

        log::info!("Deleted contact: {} ({})", contact.email, contact_id);
        Ok(())
    }

    /// Delete multiple contacts
    pub fn delete_contacts(&self, contact_ids: Vec<String>) -> Result<u32, String> {
        let mut deleted = 0;
        let mut affected_lists: Vec<String> = Vec::new();

        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        for id in contact_ids {
            if let Some(contact) = contacts.remove(&id) {
                affected_lists.extend(contact.list_ids);
                deleted += 1;
            }
        }

        drop(contacts);

        // Update list counts
        affected_lists.sort();
        affected_lists.dedup();
        self.update_list_counts(&affected_lists)?;

        log::info!("Deleted {} contacts", deleted);
        Ok(deleted)
    }

    /// Add tags to contacts
    pub fn add_tags_to_contacts(&self, contact_ids: Vec<String>, tags: Vec<String>) -> Result<u32, String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut updated = 0;
        let now = Utc::now().to_rfc3339();

        for id in contact_ids {
            if let Some(contact) = contacts.get_mut(&id) {
                for tag in &tags {
                    if !contact.tags.contains(tag) {
                        contact.tags.push(tag.clone());
                    }
                }
                contact.updated_at = now.clone();
                updated += 1;
            }
        }

        Ok(updated)
    }

    /// Remove tags from contacts
    pub fn remove_tags_from_contacts(&self, contact_ids: Vec<String>, tags: Vec<String>) -> Result<u32, String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut updated = 0;
        let now = Utc::now().to_rfc3339();

        for id in contact_ids {
            if let Some(contact) = contacts.get_mut(&id) {
                contact.tags.retain(|t| !tags.contains(t));
                contact.updated_at = now.clone();
                updated += 1;
            }
        }

        Ok(updated)
    }

    /// Add contacts to lists
    pub fn add_contacts_to_lists(&self, contact_ids: Vec<String>, list_ids: Vec<String>) -> Result<u32, String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut updated = 0;
        let now = Utc::now().to_rfc3339();

        for id in contact_ids {
            if let Some(contact) = contacts.get_mut(&id) {
                for list_id in &list_ids {
                    if !contact.list_ids.contains(list_id) {
                        contact.list_ids.push(list_id.clone());
                    }
                }
                contact.updated_at = now.clone();
                updated += 1;
            }
        }

        drop(contacts);
        self.update_list_counts(&list_ids)?;

        Ok(updated)
    }

    /// Remove contacts from lists
    pub fn remove_contacts_from_lists(&self, contact_ids: Vec<String>, list_ids: Vec<String>) -> Result<u32, String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut updated = 0;
        let now = Utc::now().to_rfc3339();

        for id in contact_ids {
            if let Some(contact) = contacts.get_mut(&id) {
                contact.list_ids.retain(|l| !list_ids.contains(l));
                contact.updated_at = now.clone();
                updated += 1;
            }
        }

        drop(contacts);
        self.update_list_counts(&list_ids)?;

        Ok(updated)
    }

    /// Update contact engagement stats (called when emails are sent/opened/clicked)
    pub fn update_contact_engagement(&self, 
        email: &str, 
        sent: bool, 
        opened: bool, 
        clicked: bool,
        bounced: bool,
    ) -> Result<(), String> {
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let email_lower = email.to_lowercase();
        let contact = contacts.values_mut()
            .find(|c| c.email.to_lowercase() == email_lower)
            .ok_or_else(|| format!("Contact not found: {}", email))?;

        let now = Utc::now().to_rfc3339();

        if sent {
            contact.email_count += 1;
            contact.last_email_sent = Some(now.clone());
        }
        if opened {
            contact.open_count += 1;
            contact.last_email_opened = Some(now.clone());
        }
        if clicked {
            contact.click_count += 1;
            contact.last_email_clicked = Some(now.clone());
        }
        if bounced {
            contact.bounce_count += 1;
            if contact.bounce_count >= 3 {
                contact.status = SubscriptionStatus::Bounced;
            }
        }

        contact.updated_at = now;

        Ok(())
    }

    // =========================================================================
    // List Operations
    // =========================================================================

    /// Get all lists
    pub fn get_lists(&self) -> Result<Vec<ContactList>, String> {
        let lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        let mut list_vec: Vec<ContactList> = lists.values().cloned().collect();
        list_vec.sort_by(|a, b| {
            if a.is_default { return std::cmp::Ordering::Less; }
            if b.is_default { return std::cmp::Ordering::Greater; }
            a.name.cmp(&b.name)
        });
        
        Ok(list_vec)
    }

    /// Get a single list
    pub fn get_list(&self, list_id: &str) -> Result<ContactList, String> {
        let lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        lists.get(list_id)
            .cloned()
            .ok_or_else(|| format!("List not found: {}", list_id))
    }

    /// Create a new list
    pub fn create_list(&self, name: String, description: Option<String>, color: Option<String>) -> Result<ContactList, String> {
        if name.trim().is_empty() {
            return Err("List name cannot be empty".to_string());
        }

        let mut list = ContactList::new(name);
        list.description = description;
        list.color = color;

        let list_id = list.id.clone();

        let mut lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        lists.insert(list_id, list.clone());

        log::info!("Created list: {}", list.name);
        Ok(list)
    }

    /// Update a list
    pub fn update_list(&self, list_id: &str, name: Option<String>, description: Option<String>, color: Option<String>) -> Result<ContactList, String> {
        let mut lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        let list = lists.get_mut(list_id)
            .ok_or_else(|| format!("List not found: {}", list_id))?;

        if list.is_default {
            return Err("Cannot modify the default list".to_string());
        }

        if let Some(name) = name {
            if name.trim().is_empty() {
                return Err("List name cannot be empty".to_string());
            }
            list.name = name;
        }
        if let Some(description) = description {
            list.description = Some(description);
        }
        if let Some(color) = color {
            list.color = Some(color);
        }
        list.updated_at = Utc::now().to_rfc3339();

        Ok(list.clone())
    }

    /// Delete a list
    pub fn delete_list(&self, list_id: &str) -> Result<(), String> {
        let mut lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        let list = lists.get(list_id)
            .ok_or_else(|| format!("List not found: {}", list_id))?;

        if list.is_default {
            return Err("Cannot delete the default list".to_string());
        }

        lists.remove(list_id);

        // Remove list from all contacts
        drop(lists);
        
        let mut contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        for contact in contacts.values_mut() {
            contact.list_ids.retain(|id| id != list_id);
        }

        log::info!("Deleted list: {}", list_id);
        Ok(())
    }

    /// Update list contact counts
    fn update_list_counts(&self, list_ids: &[String]) -> Result<(), String> {
        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        // Update default list count (all contacts)
        if let Some(default_list) = lists.get_mut("default") {
            default_list.contact_count = contacts.len() as u32;
        }

        // Update specific list counts
        for list_id in list_ids {
            if list_id == "default" { continue; }
            
            if let Some(list) = lists.get_mut(list_id) {
                list.contact_count = contacts.values()
                    .filter(|c| c.list_ids.contains(list_id))
                    .count() as u32;
            }
        }

        Ok(())
    }

    // =========================================================================
    // Segment Operations
    // =========================================================================

    /// Get all segments
    pub fn get_segments(&self) -> Result<Vec<Segment>, String> {
        let segments = self.segments.lock()
            .map_err(|e| format!("Failed to acquire segments lock: {}", e))?;
        
        Ok(segments.values().cloned().collect())
    }

    /// Create a segment
    pub fn create_segment(&self, name: String, description: Option<String>, rules: Vec<SegmentRule>, rule_operator: RuleOperator) -> Result<Segment, String> {
        if name.trim().is_empty() {
            return Err("Segment name cannot be empty".to_string());
        }

        let now = Utc::now().to_rfc3339();
        let segment = Segment {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            rules,
            rule_operator,
            contact_count: 0,
            created_at: now.clone(),
            updated_at: now,
        };

        let mut segments = self.segments.lock()
            .map_err(|e| format!("Failed to acquire segments lock: {}", e))?;
        
        segments.insert(segment.id.clone(), segment.clone());

        // Calculate initial count
        drop(segments);
        let mut updated = segment.clone();
        updated.contact_count = self.get_segment_contacts(&segment.id)?.len() as u32;

        log::info!("Created segment: {}", updated.name);
        Ok(updated)
    }

    /// Get contacts matching a segment
    pub fn get_segment_contacts(&self, segment_id: &str) -> Result<Vec<Contact>, String> {
        let segments = self.segments.lock()
            .map_err(|e| format!("Failed to acquire segments lock: {}", e))?;
        
        let segment = segments.get(segment_id)
            .ok_or_else(|| format!("Segment not found: {}", segment_id))?
            .clone();
        
        drop(segments);

        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let matching: Vec<Contact> = contacts.values()
            .filter(|contact| self.contact_matches_segment(contact, &segment))
            .cloned()
            .collect();

        Ok(matching)
    }

    /// Check if a contact matches segment rules
    fn contact_matches_segment(&self, contact: &Contact, segment: &Segment) -> bool {
        if segment.rules.is_empty() {
            return true;
        }

        let results: Vec<bool> = segment.rules.iter()
            .map(|rule| self.evaluate_rule(contact, rule))
            .collect();

        match segment.rule_operator {
            RuleOperator::And => results.iter().all(|&r| r),
            RuleOperator::Or => results.iter().any(|&r| r),
        }
    }

    /// Evaluate a single rule against a contact
    fn evaluate_rule(&self, contact: &Contact, rule: &SegmentRule) -> bool {
        let field_value = match rule.field.as_str() {
            "email" => Some(contact.email.clone()),
            "first_name" => contact.first_name.clone(),
            "last_name" => contact.last_name.clone(),
            "company" => contact.company.clone(),
            "phone" => contact.phone.clone(),
            "source" => Some(contact.source.clone()),
            "status" => Some(format!("{:?}", contact.status)),
            _ => contact.custom_fields.get(&rule.field).cloned(),
        };

        match (&rule.operator, field_value) {
            (RuleComparison::IsEmpty, None) => true,
            (RuleComparison::IsEmpty, Some(v)) => v.is_empty(),
            (RuleComparison::IsNotEmpty, None) => false,
            (RuleComparison::IsNotEmpty, Some(v)) => !v.is_empty(),
            (_, None) => false,
            (RuleComparison::Equals, Some(v)) => v.to_lowercase() == rule.value.to_lowercase(),
            (RuleComparison::NotEquals, Some(v)) => v.to_lowercase() != rule.value.to_lowercase(),
            (RuleComparison::Contains, Some(v)) => v.to_lowercase().contains(&rule.value.to_lowercase()),
            (RuleComparison::NotContains, Some(v)) => !v.to_lowercase().contains(&rule.value.to_lowercase()),
            (RuleComparison::StartsWith, Some(v)) => v.to_lowercase().starts_with(&rule.value.to_lowercase()),
            (RuleComparison::EndsWith, Some(v)) => v.to_lowercase().ends_with(&rule.value.to_lowercase()),
            (RuleComparison::GreaterThan, Some(v)) => {
                if let (Ok(a), Ok(b)) = (v.parse::<f64>(), rule.value.parse::<f64>()) {
                    a > b
                } else {
                    v > rule.value
                }
            },
            (RuleComparison::LessThan, Some(v)) => {
                if let (Ok(a), Ok(b)) = (v.parse::<f64>(), rule.value.parse::<f64>()) {
                    a < b
                } else {
                    v < rule.value
                }
            },
        }
    }

    // =========================================================================
    // Import/Export Operations
    // =========================================================================

    /// Import contacts from CSV data
    pub fn import_contacts(&self, csv_data: &str, list_id: Option<String>, source: Option<String>) -> Result<ImportResult, String> {
        use std::time::Instant;
        let start = Instant::now();

        let mut total = 0u32;
        let mut imported = 0u32;
        let mut updated = 0u32;
        let mut skipped = 0u32;
        let mut errors: Vec<ImportError> = Vec::new();

        let lines: Vec<&str> = csv_data.lines().collect();
        if lines.is_empty() {
            return Err("Empty CSV data".to_string());
        }

        // Parse header
        let header: Vec<String> = lines[0].split(',').map(|s| s.trim().to_lowercase()).collect();
        let email_idx = header.iter().position(|h| h == "email" || h == "e-mail" || h == "email_address");
        
        if email_idx.is_none() {
            return Err("CSV must have an 'email' column".to_string());
        }
        let email_idx = email_idx.unwrap();

        let first_name_idx = header.iter().position(|h| h == "first_name" || h == "firstname" || h == "first");
        let last_name_idx = header.iter().position(|h| h == "last_name" || h == "lastname" || h == "last");
        let company_idx = header.iter().position(|h| h == "company" || h == "organization" || h == "org");
        let phone_idx = header.iter().position(|h| h == "phone" || h == "phone_number" || h == "telephone");

        // Process data rows
        for (row_num, line) in lines.iter().skip(1).enumerate() {
            total += 1;
            let row = row_num as u32 + 2; // +2 for 1-indexed and header

            let fields: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
            
            if fields.len() <= email_idx {
                errors.push(ImportError {
                    row,
                    email: "".to_string(),
                    error: "Row has insufficient columns".to_string(),
                });
                skipped += 1;
                continue;
            }

            let email = fields[email_idx].to_string();
            if email.is_empty() || !email.contains('@') {
                errors.push(ImportError {
                    row,
                    email: email.clone(),
                    error: "Invalid email address".to_string(),
                });
                skipped += 1;
                continue;
            }

            let first_name = first_name_idx.and_then(|i| fields.get(i).map(|s| s.to_string())).filter(|s| !s.is_empty());
            let last_name = last_name_idx.and_then(|i| fields.get(i).map(|s| s.to_string())).filter(|s| !s.is_empty());
            let company = company_idx.and_then(|i| fields.get(i).map(|s| s.to_string())).filter(|s| !s.is_empty());
            let phone = phone_idx.and_then(|i| fields.get(i).map(|s| s.to_string())).filter(|s| !s.is_empty());

            // Check if contact exists
            if let Ok(Some(existing)) = self.get_contact_by_email(&email) {
                // Update existing contact
                match self.update_contact(
                    &existing.id,
                    None,
                    first_name,
                    last_name,
                    company,
                    phone,
                    None,
                    list_id.as_ref().map(|l| {
                        let mut lists = existing.list_ids.clone();
                        if !lists.contains(l) {
                            lists.push(l.clone());
                        }
                        lists
                    }),
                    None,
                    None,
                    None,
                ) {
                    Ok(_) => updated += 1,
                    Err(e) => {
                        errors.push(ImportError { row, email, error: e });
                        skipped += 1;
                    }
                }
            } else {
                // Create new contact
                match self.create_contact(
                    email.clone(),
                    first_name,
                    last_name,
                    company,
                    phone,
                    None,
                    list_id.as_ref().map(|l| vec![l.clone()]),
                    source.clone(),
                    None,
                ) {
                    Ok(_) => imported += 1,
                    Err(e) => {
                        errors.push(ImportError { row, email, error: e });
                        skipped += 1;
                    }
                }
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;

        log::info!(
            "Import completed: {} total, {} imported, {} updated, {} skipped in {}ms",
            total, imported, updated, skipped, duration_ms
        );

        Ok(ImportResult {
            total,
            imported,
            updated,
            skipped,
            errors,
            duration_ms,
        })
    }

    /// Export contacts to CSV format
    pub fn export_contacts(&self, filter: Option<ContactFilter>, list_id: Option<String>) -> Result<String, String> {
        let mut filter = filter.unwrap_or_default();
        filter.list_id = list_id;
        filter.per_page = Some(100000); // Get all

        let result = self.get_contacts(filter)?;

        let mut csv = String::from("email,first_name,last_name,company,phone,status,source,tags,created_at\n");

        for contact in result.contacts {
            csv.push_str(&format!(
                "{},{},{},{},{},{:?},{},{},{}\n",
                contact.email,
                contact.first_name.unwrap_or_default(),
                contact.last_name.unwrap_or_default(),
                contact.company.unwrap_or_default(),
                contact.phone.unwrap_or_default(),
                contact.status,
                contact.source,
                contact.tags.join(";"),
                contact.created_at,
            ));
        }

        Ok(csv)
    }

    // =========================================================================
    // Statistics
    // =========================================================================

    /// Get contact service statistics
    pub fn get_stats(&self) -> Result<ContactStats, String> {
        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let lists = self.lists.lock()
            .map_err(|e| format!("Failed to acquire lists lock: {}", e))?;
        
        let segments = self.segments.lock()
            .map_err(|e| format!("Failed to acquire segments lock: {}", e))?;

        let total = contacts.len() as u32;
        let subscribed = contacts.values().filter(|c| c.status == SubscriptionStatus::Subscribed).count() as u32;
        let unsubscribed = contacts.values().filter(|c| c.status == SubscriptionStatus::Unsubscribed).count() as u32;
        let bounced = contacts.values().filter(|c| c.status == SubscriptionStatus::Bounced).count() as u32;
        let pending = contacts.values().filter(|c| c.status == SubscriptionStatus::Pending).count() as u32;

        // Count contacts created this month
        let now = Utc::now();
        let month_start = now.format("%Y-%m-01").to_string();
        let contacts_this_month = contacts.values()
            .filter(|c| c.created_at >= month_start)
            .count() as u32;

        Ok(ContactStats {
            total_contacts: total,
            subscribed,
            unsubscribed,
            bounced,
            pending,
            total_lists: lists.len() as u32,
            total_segments: segments.len() as u32,
            contacts_this_month,
        })
    }

    /// Get all unique tags across all contacts
    pub fn get_all_tags(&self) -> Result<Vec<String>, String> {
        let contacts = self.contacts.lock()
            .map_err(|e| format!("Failed to acquire contacts lock: {}", e))?;
        
        let mut tags: Vec<String> = contacts.values()
            .flat_map(|c| c.tags.iter().cloned())
            .collect();
        
        tags.sort();
        tags.dedup();

        Ok(tags)
    }
}
