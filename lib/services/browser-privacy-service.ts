// CUBE Nexum - Privacy Dashboard TypeScript Service
// Complete TypeScript client for privacy controls

import { invoke } from '@tauri-apps/api/core';

// ==================== Types ====================

export type PrivacyLevel = 'Standard' | 'Strict' | 'Custom';

export type TrackerType = 
  | 'Advertising'
  | 'Analytics'
  | 'Social'
  | 'Cryptominer'
  | 'Fingerprinting'
  | 'ContentTracker'
  | 'Unknown';

export type CookiePolicy = 
  | 'AllowAll'
  | 'BlockThirdParty'
  | 'BlockAllCookies'
  | 'Custom';

export type PermissionDefault = 'Allow' | 'Block' | 'Ask';

export type SameSite = 'Strict' | 'Lax' | 'None';

export type TimeRange = 'LastHour' | 'LastDay' | 'LastWeek' | 'LastMonth' | 'AllTime';

export interface PrivacySettings {
  privacy_level: PrivacyLevel;
  // Tracking Protection
  block_trackers: boolean;
  block_ads: boolean;
  block_social_trackers: boolean;
  block_cryptominers: boolean;
  block_fingerprinting: boolean;
  // Cookies
  cookie_policy: CookiePolicy;
  block_third_party_cookies: boolean;
  clear_cookies_on_exit: boolean;
  cookie_lifetime_days: number | null;
  // Fingerprinting
  randomize_canvas: boolean;
  randomize_webgl: boolean;
  randomize_audio: boolean;
  spoof_user_agent: boolean;
  spoof_timezone: boolean;
  spoof_language: boolean;
  spoof_screen_resolution: boolean;
  // Network Privacy
  use_doh: boolean;
  doh_provider: string;
  block_webrtc_leak: boolean;
  disable_referrer: boolean;
  send_dnt_header: boolean;
  send_gpc_header: boolean;
  // Data Clearing
  auto_clear_history: boolean;
  auto_clear_downloads: boolean;
  auto_clear_cache: boolean;
  auto_clear_form_data: boolean;
  auto_clear_passwords: boolean;
  clear_interval_hours: number;
  // HTTPS
  https_only_mode: boolean;
  upgrade_insecure_requests: boolean;
  // Permissions
  default_camera_permission: PermissionDefault;
  default_microphone_permission: PermissionDefault;
  default_location_permission: PermissionDefault;
  default_notification_permission: PermissionDefault;
  // Site-specific
  whitelisted_sites: string[];
  blacklisted_sites: string[];
}

export interface BlockedTracker {
  id: string;
  domain: string;
  tracker_type: TrackerType;
  company: string | null;
  blocked_count: number;
  first_blocked: string;
  last_blocked: string;
  source_urls: string[];
}

export interface Cookie {
  domain: string;
  name: string;
  value: string;
  path: string;
  expires: string | null;
  secure: boolean;
  http_only: boolean;
  same_site: SameSite;
  is_third_party: boolean;
  created_at: string;
  last_accessed: string;
}

export interface FingerprintProtection {
  canvas_noise: number;
  webgl_noise: number;
  audio_noise: number;
  font_list_randomized: boolean;
  user_agent: string | null;
  timezone: string | null;
  language: string | null;
  screen_resolution: [number, number] | null;
  last_rotated: string;
}

export interface SitePermissions {
  domain: string;
  camera: boolean | null;
  microphone: boolean | null;
  location: boolean | null;
  notifications: boolean | null;
  clipboard: boolean | null;
  autoplay: boolean | null;
  popups: boolean | null;
  javascript: boolean | null;
  images: boolean | null;
  cookies: boolean | null;
  created_at: string;
  modified_at: string;
}

export interface PrivacyStats {
  trackers_blocked_today: number;
  trackers_blocked_week: number;
  trackers_blocked_month: number;
  trackers_blocked_total: number;
  ads_blocked_today: number;
  ads_blocked_total: number;
  cookies_blocked_total: number;
  fingerprinting_attempts_blocked: number;
  https_upgrades: number;
  data_saved_bytes: number;
  top_blocked_trackers: [string, number][];
  top_blocked_domains: [string, number][];
  protection_score: number;
}

export interface PrivacyReport {
  generated_at: string;
  period_start: string;
  period_end: string;
  stats: PrivacyStats;
  trackers_by_type: Record<string, number>;
  trackers_by_company: Record<string, number>;
  sites_with_most_trackers: [string, number][];
  recommendations: string[];
}

export interface DoHProvider {
  name: string;
  url: string;
  description: string;
  privacy_policy: string | null;
}

export interface ClearDataOptions {
  history: boolean;
  downloads: boolean;
  cookies: boolean;
  cache: boolean;
  form_data: boolean;
  passwords: boolean;
  time_range: TimeRange | null;
}

export interface ClearDataResult {
  history_cleared: number;
  downloads_cleared: number;
  cookies_cleared: number;
  cache_cleared_bytes: number;
  form_data_cleared: number;
  passwords_cleared: number;
}

// ==================== Settings Commands ====================

export async function getPrivacySettings(): Promise<PrivacySettings> {
  return invoke<PrivacySettings>('privacy_get_settings');
}

export async function updatePrivacySettings(settings: PrivacySettings): Promise<void> {
  return invoke('privacy_update_settings', { settings });
}

export async function setPrivacyLevel(level: PrivacyLevel): Promise<void> {
  return invoke('privacy_set_level', { level });
}

export async function getProtectionScore(): Promise<number> {
  return invoke<number>('privacy_get_protection_score');
}

// ==================== Tracker Blocking Commands ====================

export async function recordBlockedTracker(
  domain: string,
  trackerType: TrackerType,
  sourceUrl: string
): Promise<void> {
  return invoke('privacy_record_blocked_tracker', {
    domain,
    tracker_type: trackerType,
    source_url: sourceUrl,
  });
}

export async function getBlockedTrackers(): Promise<BlockedTracker[]> {
  return invoke<BlockedTracker[]>('privacy_get_blocked_trackers');
}

export async function getBlockedTrackersByType(
  trackerType: TrackerType
): Promise<BlockedTracker[]> {
  return invoke<BlockedTracker[]>('privacy_get_blocked_trackers_by_type', {
    tracker_type: trackerType,
  });
}

export async function clearBlockedTrackers(): Promise<void> {
  return invoke('privacy_clear_blocked_trackers');
}

// ==================== Cookie Commands ====================

export async function addCookie(cookie: Cookie): Promise<void> {
  return invoke('privacy_add_cookie', { cookie });
}

export async function getCookies(): Promise<Cookie[]> {
  return invoke<Cookie[]>('privacy_get_cookies');
}

export async function getCookiesForDomain(domain: string): Promise<Cookie[]> {
  return invoke<Cookie[]>('privacy_get_cookies_for_domain', { domain });
}

export async function getThirdPartyCookies(): Promise<Cookie[]> {
  return invoke<Cookie[]>('privacy_get_third_party_cookies');
}

export async function deleteCookie(domain: string, name: string): Promise<void> {
  return invoke('privacy_delete_cookie', { domain, name });
}

export async function deleteCookiesForDomain(domain: string): Promise<number> {
  return invoke<number>('privacy_delete_cookies_for_domain', { domain });
}

export async function clearAllCookies(): Promise<number> {
  return invoke<number>('privacy_clear_all_cookies');
}

export async function clearThirdPartyCookies(): Promise<number> {
  return invoke<number>('privacy_clear_third_party_cookies');
}

export async function getCookieStats(): Promise<Record<string, number>> {
  return invoke<Record<string, number>>('privacy_get_cookie_stats');
}

// ==================== Fingerprint Commands ====================

export async function getFingerprintProtection(): Promise<FingerprintProtection> {
  return invoke<FingerprintProtection>('privacy_get_fingerprint_protection');
}

export async function rotateFingerprint(): Promise<FingerprintProtection> {
  return invoke<FingerprintProtection>('privacy_rotate_fingerprint');
}

export async function setSpoofedUserAgent(userAgent: string | null): Promise<void> {
  return invoke('privacy_set_spoofed_user_agent', { user_agent: userAgent });
}

export async function setSpoofedTimezone(timezone: string | null): Promise<void> {
  return invoke('privacy_set_spoofed_timezone', { timezone });
}

export async function setSpoofedResolution(
  width: number | null,
  height: number | null
): Promise<void> {
  return invoke('privacy_set_spoofed_resolution', { width, height });
}

// ==================== Site Permissions Commands ====================

export async function getSitePermissions(domain: string): Promise<SitePermissions | null> {
  return invoke<SitePermissions | null>('privacy_get_site_permissions', { domain });
}

export async function setSitePermission(
  domain: string,
  permissionType: string,
  value: boolean | null
): Promise<void> {
  return invoke('privacy_set_site_permission', {
    domain,
    permission_type: permissionType,
    value,
  });
}

export async function getAllSitePermissions(): Promise<SitePermissions[]> {
  return invoke<SitePermissions[]>('privacy_get_all_site_permissions');
}

export async function clearSitePermissions(domain: string): Promise<void> {
  return invoke('privacy_clear_site_permissions', { domain });
}

export async function clearAllSitePermissions(): Promise<void> {
  return invoke('privacy_clear_all_site_permissions');
}

// ==================== Whitelist/Blacklist Commands ====================

export async function addToWhitelist(domain: string): Promise<void> {
  return invoke('privacy_add_to_whitelist', { domain });
}

export async function removeFromWhitelist(domain: string): Promise<void> {
  return invoke('privacy_remove_from_whitelist', { domain });
}

export async function addToBlacklist(domain: string): Promise<void> {
  return invoke('privacy_add_to_blacklist', { domain });
}

export async function removeFromBlacklist(domain: string): Promise<void> {
  return invoke('privacy_remove_from_blacklist', { domain });
}

export async function isWhitelisted(domain: string): Promise<boolean> {
  return invoke<boolean>('privacy_is_whitelisted', { domain });
}

export async function isBlacklisted(domain: string): Promise<boolean> {
  return invoke<boolean>('privacy_is_blacklisted', { domain });
}

// ==================== Statistics Commands ====================

export async function getPrivacyStats(): Promise<PrivacyStats> {
  return invoke<PrivacyStats>('privacy_get_stats');
}

export async function resetDailyStats(): Promise<void> {
  return invoke('privacy_reset_daily_stats');
}

export async function resetWeeklyStats(): Promise<void> {
  return invoke('privacy_reset_weekly_stats');
}

export async function resetMonthlyStats(): Promise<void> {
  return invoke('privacy_reset_monthly_stats');
}

// ==================== Report Commands ====================

export async function generatePrivacyReport(days: number): Promise<PrivacyReport> {
  return invoke<PrivacyReport>('privacy_generate_report', { days });
}

// ==================== DoH Commands ====================

export async function getDoHProviders(): Promise<DoHProvider[]> {
  return invoke<DoHProvider[]>('privacy_get_doh_providers');
}

export async function setDoHProvider(url: string): Promise<void> {
  return invoke('privacy_set_doh_provider', { url });
}

// ==================== Data Clearing Commands ====================

export async function clearBrowsingData(options: ClearDataOptions): Promise<ClearDataResult> {
  return invoke<ClearDataResult>('privacy_clear_browsing_data', { options });
}

// ==================== Helper Functions ====================

export function formatTrackerType(type: TrackerType): string {
  const typeNames: Record<TrackerType, string> = {
    Advertising: '📢 Advertising',
    Analytics: '📊 Analytics',
    Social: '👥 Social',
    Cryptominer: '⛏️ Cryptominer',
    Fingerprinting: '🔍 Fingerprinting',
    ContentTracker: '📄 Content',
    Unknown: '❓ Unknown',
  };
  return typeNames[type] || type;
}

export function formatDataSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getPrivacyLevelDescription(level: PrivacyLevel): string {
  const descriptions: Record<PrivacyLevel, string> = {
    Standard: 'Balanced protection with minimal site breakage',
    Strict: 'Maximum protection, some sites may not work correctly',
    Custom: 'Your personalized privacy settings',
  };
  return descriptions[level];
}

export function getCookiePolicyDescription(policy: CookiePolicy): string {
  const descriptions: Record<CookiePolicy, string> = {
    AllowAll: 'Accept all cookies (not recommended)',
    BlockThirdParty: 'Block third-party cookies (recommended)',
    BlockAllCookies: 'Block all cookies (some sites may break)',
    Custom: 'Custom cookie settings per site',
  };
  return descriptions[policy];
}

export function getProtectionScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#eab308'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export function getProtectionScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

export function groupTrackersByCompany(
  trackers: BlockedTracker[]
): Map<string, BlockedTracker[]> {
  const grouped = new Map<string, BlockedTracker[]>();
  
  for (const tracker of trackers) {
    const company = tracker.company || 'Unknown';
    const existing = grouped.get(company) || [];
    existing.push(tracker);
    grouped.set(company, existing);
  }
  
  return grouped;
}

export function groupTrackersByType(
  trackers: BlockedTracker[]
): Map<TrackerType, BlockedTracker[]> {
  const grouped = new Map<TrackerType, BlockedTracker[]>();
  
  for (const tracker of trackers) {
    const existing = grouped.get(tracker.tracker_type) || [];
    existing.push(tracker);
    grouped.set(tracker.tracker_type, existing);
  }
  
  return grouped;
}

export function sortTrackersByCount(
  trackers: BlockedTracker[],
  descending: boolean = true
): BlockedTracker[] {
  return [...trackers].sort((a, b) => 
    descending 
      ? b.blocked_count - a.blocked_count 
      : a.blocked_count - b.blocked_count
  );
}

export const PERMISSION_TYPES = [
  { key: 'camera', label: 'Camera', icon: '📷' },
  { key: 'microphone', label: 'Microphone', icon: '🎤' },
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'clipboard', label: 'Clipboard', icon: '📋' },
  { key: 'autoplay', label: 'Autoplay', icon: '▶️' },
  { key: 'popups', label: 'Popups', icon: '🪟' },
  { key: 'javascript', label: 'JavaScript', icon: '⚡' },
  { key: 'images', label: 'Images', icon: '🖼️' },
  { key: 'cookies', label: 'Cookies', icon: '🍪' },
] as const;

export const DEFAULT_CLEAR_DATA_OPTIONS: ClearDataOptions = {
  history: true,
  downloads: false,
  cookies: true,
  cache: true,
  form_data: false,
  passwords: false,
  time_range: 'AllTime',
};
