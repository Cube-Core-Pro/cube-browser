// Contact Management Tauri Commands
// ==================================
// Commands for managing email contacts, lists, and segments

use crate::services::contact_service::{
    ContactServiceState, Contact, ContactList, ContactFilter, 
    PaginatedContacts, ContactStats, ImportResult, SubscriptionStatus,
    Segment, SegmentRule, RuleOperator, RuleComparison
};
use std::collections::HashMap;
use tauri::State;

// =============================================================================
// Contact Commands
// =============================================================================

/// Get contacts with optional filtering and pagination
#[tauri::command]
pub async fn contacts_get_all(
    filter: Option<ContactFilter>,
    state: State<'_, ContactServiceState>,
) -> Result<PaginatedContacts, String> {
    let filter = filter.unwrap_or_default();
    state.get_contacts(filter)
}

/// Get a single contact by ID
#[tauri::command]
pub async fn contacts_get(
    contact_id: String,
    state: State<'_, ContactServiceState>,
) -> Result<Contact, String> {
    state.get_contact(&contact_id)
}

/// Get a contact by email
#[tauri::command]
pub async fn contacts_get_by_email(
    email: String,
    state: State<'_, ContactServiceState>,
) -> Result<Option<Contact>, String> {
    state.get_contact_by_email(&email)
}

/// Create a new contact
#[tauri::command]
pub async fn contacts_create(
    email: String,
    first_name: Option<String>,
    last_name: Option<String>,
    company: Option<String>,
    phone: Option<String>,
    tags: Option<Vec<String>>,
    list_ids: Option<Vec<String>>,
    source: Option<String>,
    custom_fields: Option<HashMap<String, String>>,
    state: State<'_, ContactServiceState>,
) -> Result<Contact, String> {
    state.create_contact(
        email,
        first_name,
        last_name,
        company,
        phone,
        tags,
        list_ids,
        source,
        custom_fields,
    )
}

/// Update an existing contact
#[tauri::command]
pub async fn contacts_update(
    contact_id: String,
    email: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
    company: Option<String>,
    phone: Option<String>,
    tags: Option<Vec<String>>,
    list_ids: Option<Vec<String>>,
    status: Option<String>,
    custom_fields: Option<HashMap<String, String>>,
    notes: Option<String>,
    state: State<'_, ContactServiceState>,
) -> Result<Contact, String> {
    let status = status.map(|s| match s.as_str() {
        "subscribed" => SubscriptionStatus::Subscribed,
        "unsubscribed" => SubscriptionStatus::Unsubscribed,
        "pending" => SubscriptionStatus::Pending,
        "bounced" => SubscriptionStatus::Bounced,
        "complained" => SubscriptionStatus::Complained,
        _ => SubscriptionStatus::Subscribed,
    });

    state.update_contact(
        &contact_id,
        email,
        first_name,
        last_name,
        company,
        phone,
        tags,
        list_ids,
        status,
        custom_fields,
        notes,
    )
}

/// Delete a contact
#[tauri::command]
pub async fn contacts_delete(
    contact_id: String,
    state: State<'_, ContactServiceState>,
) -> Result<(), String> {
    state.delete_contact(&contact_id)
}

/// Delete multiple contacts
#[tauri::command]
pub async fn contacts_delete_bulk(
    contact_ids: Vec<String>,
    state: State<'_, ContactServiceState>,
) -> Result<u32, String> {
    state.delete_contacts(contact_ids)
}

/// Add tags to contacts
#[tauri::command]
pub async fn contacts_add_tags(
    contact_ids: Vec<String>,
    tags: Vec<String>,
    state: State<'_, ContactServiceState>,
) -> Result<u32, String> {
    state.add_tags_to_contacts(contact_ids, tags)
}

/// Remove tags from contacts
#[tauri::command]
pub async fn contacts_remove_tags(
    contact_ids: Vec<String>,
    tags: Vec<String>,
    state: State<'_, ContactServiceState>,
) -> Result<u32, String> {
    state.remove_tags_from_contacts(contact_ids, tags)
}

/// Add contacts to lists
#[tauri::command]
pub async fn contacts_add_to_lists(
    contact_ids: Vec<String>,
    list_ids: Vec<String>,
    state: State<'_, ContactServiceState>,
) -> Result<u32, String> {
    state.add_contacts_to_lists(contact_ids, list_ids)
}

/// Remove contacts from lists
#[tauri::command]
pub async fn contacts_remove_from_lists(
    contact_ids: Vec<String>,
    list_ids: Vec<String>,
    state: State<'_, ContactServiceState>,
) -> Result<u32, String> {
    state.remove_contacts_from_lists(contact_ids, list_ids)
}

/// Update contact engagement (for email tracking)
#[tauri::command]
pub async fn contacts_update_engagement(
    email: String,
    sent: Option<bool>,
    opened: Option<bool>,
    clicked: Option<bool>,
    bounced: Option<bool>,
    state: State<'_, ContactServiceState>,
) -> Result<(), String> {
    state.update_contact_engagement(
        &email,
        sent.unwrap_or(false),
        opened.unwrap_or(false),
        clicked.unwrap_or(false),
        bounced.unwrap_or(false),
    )
}

// =============================================================================
// List Commands
// =============================================================================

/// Get all contact lists
#[tauri::command]
pub async fn contacts_get_lists(
    state: State<'_, ContactServiceState>,
) -> Result<Vec<ContactList>, String> {
    state.get_lists()
}

/// Get a single list
#[tauri::command]
pub async fn contacts_get_list(
    list_id: String,
    state: State<'_, ContactServiceState>,
) -> Result<ContactList, String> {
    state.get_list(&list_id)
}

/// Create a new list
#[tauri::command]
pub async fn contacts_create_list(
    name: String,
    description: Option<String>,
    color: Option<String>,
    state: State<'_, ContactServiceState>,
) -> Result<ContactList, String> {
    state.create_list(name, description, color)
}

/// Update a list
#[tauri::command]
pub async fn contacts_update_list(
    list_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
    state: State<'_, ContactServiceState>,
) -> Result<ContactList, String> {
    state.update_list(&list_id, name, description, color)
}

/// Delete a list
#[tauri::command]
pub async fn contacts_delete_list(
    list_id: String,
    state: State<'_, ContactServiceState>,
) -> Result<(), String> {
    state.delete_list(&list_id)
}

// =============================================================================
// Segment Commands
// =============================================================================

/// Get all segments
#[tauri::command]
pub async fn contacts_get_segments(
    state: State<'_, ContactServiceState>,
) -> Result<Vec<Segment>, String> {
    state.get_segments()
}

/// Create a segment
#[tauri::command]
pub async fn contacts_create_segment(
    name: String,
    description: Option<String>,
    rules: Vec<SegmentRuleInput>,
    rule_operator: String,
    state: State<'_, ContactServiceState>,
) -> Result<Segment, String> {
    let parsed_rules: Vec<SegmentRule> = rules.into_iter()
        .map(|r| SegmentRule {
            field: r.field,
            operator: match r.operator.as_str() {
                "equals" => RuleComparison::Equals,
                "not_equals" => RuleComparison::NotEquals,
                "contains" => RuleComparison::Contains,
                "not_contains" => RuleComparison::NotContains,
                "starts_with" => RuleComparison::StartsWith,
                "ends_with" => RuleComparison::EndsWith,
                "greater_than" => RuleComparison::GreaterThan,
                "less_than" => RuleComparison::LessThan,
                "is_empty" => RuleComparison::IsEmpty,
                "is_not_empty" => RuleComparison::IsNotEmpty,
                _ => RuleComparison::Equals,
            },
            value: r.value,
        })
        .collect();

    let operator = match rule_operator.as_str() {
        "or" => RuleOperator::Or,
        _ => RuleOperator::And,
    };

    state.create_segment(name, description, parsed_rules, operator)
}

/// Helper struct for segment rule input
#[derive(serde::Deserialize)]
pub struct SegmentRuleInput {
    pub field: String,
    pub operator: String,
    pub value: String,
}

/// Get contacts matching a segment
#[tauri::command]
pub async fn contacts_get_segment_contacts(
    segment_id: String,
    state: State<'_, ContactServiceState>,
) -> Result<Vec<Contact>, String> {
    state.get_segment_contacts(&segment_id)
}

// =============================================================================
// Import/Export Commands
// =============================================================================

/// Import contacts from CSV
#[tauri::command]
pub async fn contacts_import_csv(
    csv_data: String,
    list_id: Option<String>,
    source: Option<String>,
    state: State<'_, ContactServiceState>,
) -> Result<ImportResult, String> {
    state.import_contacts(&csv_data, list_id, source)
}

/// Export contacts to CSV
#[tauri::command]
pub async fn contacts_export_csv(
    filter: Option<ContactFilter>,
    list_id: Option<String>,
    state: State<'_, ContactServiceState>,
) -> Result<String, String> {
    state.export_contacts(filter, list_id)
}

// =============================================================================
// Statistics Commands
// =============================================================================

/// Get contact statistics
#[tauri::command]
pub async fn contacts_get_stats(
    state: State<'_, ContactServiceState>,
) -> Result<ContactStats, String> {
    state.get_stats()
}

/// Get all unique tags
#[tauri::command]
pub async fn contacts_get_tags(
    state: State<'_, ContactServiceState>,
) -> Result<Vec<String>, String> {
    state.get_all_tags()
}
