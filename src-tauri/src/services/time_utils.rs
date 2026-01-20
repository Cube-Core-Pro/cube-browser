//! Time utility functions for CUBE Nexum
//!
//! Provides safe timestamp generation without panics.
//! These functions replace direct `.unwrap()` calls on `SystemTime::now()`.

use std::time::{SystemTime, UNIX_EPOCH};

/// Get current Unix timestamp in seconds.
/// Returns 0 on system time error (pre-Unix epoch clock, which should never happen in practice).
///
/// # Example
/// ```
/// let timestamp = current_timestamp_secs();
/// ```
#[inline]
pub fn current_timestamp_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// Get current Unix timestamp in milliseconds.
/// Returns 0 on system time error.
///
/// # Example
/// ```
/// let timestamp_ms = current_timestamp_millis();
/// ```
#[inline]
pub fn current_timestamp_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

/// Get current Unix timestamp in nanoseconds.
/// Returns 0 on system time error.
#[inline]
pub fn current_timestamp_nanos() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0)
}

/// Get current ISO 8601 timestamp string.
/// Returns empty string on error.
///
/// # Example
/// ```
/// let iso_time = current_iso_timestamp();
/// // "2026-01-03T12:34:56Z" or similar
/// ```
pub fn current_iso_timestamp() -> String {
    let secs = current_timestamp_secs();
    if secs == 0 {
        return String::new();
    }
    
    // Convert seconds to ISO 8601 format
    // Note: In production, use chrono crate for proper timezone handling
    let days_since_epoch = secs / 86400;
    let time_of_day = secs % 86400;
    
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;
    
    // Simplified date calculation (no leap year handling for this basic version)
    // For production use, prefer chrono::Utc::now().to_rfc3339()
    let year = 1970 + (days_since_epoch / 365);
    let day_of_year = days_since_epoch % 365;
    let month = day_of_year / 30 + 1;
    let day = day_of_year % 30 + 1;
    
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month.min(12), day.min(31), hours, minutes, seconds
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_timestamp_secs() {
        let ts = current_timestamp_secs();
        // Should be after Jan 1, 2024 (1704067200)
        assert!(ts > 1704067200);
    }

    #[test]
    fn test_current_timestamp_millis() {
        let ts = current_timestamp_millis();
        // Should be > seconds * 1000
        assert!(ts > 1704067200000);
    }

    #[test]
    fn test_iso_timestamp_format() {
        let iso = current_iso_timestamp();
        assert!(!iso.is_empty());
        assert!(iso.contains('T'));
        assert!(iso.ends_with('Z'));
    }
}
