/**
 * Database Schema Extensions for CUBE Elite v6
 * 
 * This module adds tables for:
 * - Investor System (investors, investments, contracts, tokens, payouts)
 * - Affiliate System (affiliates, referrals, commissions, white-label)
 * - Enterprise SSO/LDAP (providers, sessions, directory sync)
 * - Multi-Tenant System (tenants, organizations, users)
 * 
 * Copyright (c) 2026 CUBE AI.tools - All rights reserved
 */

use rusqlite::{Connection, Result};

/// Create all extended database tables for enterprise features
pub fn create_extended_tables(conn: &Connection) -> Result<()> {
    create_investor_tables(conn)?;
    create_affiliate_tables(conn)?;
    create_sso_tables(conn)?;
    create_tenant_tables(conn)?;
    create_browser_profile_tables(conn)?;
    Ok(())
}

/// Create investor system tables
fn create_investor_tables(conn: &Connection) -> Result<()> {
    // Investors table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS investors (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            tier TEXT NOT NULL DEFAULT 'angel',
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            company TEXT,
            kyc_verified INTEGER NOT NULL DEFAULT 0,
            accredited_investor INTEGER NOT NULL DEFAULT 0,
            total_invested REAL NOT NULL DEFAULT 0,
            total_returns REAL NOT NULL DEFAULT 0,
            cube_tokens REAL NOT NULL DEFAULT 0,
            staked_tokens REAL NOT NULL DEFAULT 0,
            wallet_address TEXT,
            bank_details TEXT,
            preferences TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
        "#,
        [],
    )?;

    // Investments table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            investor_id TEXT NOT NULL,
            tier TEXT NOT NULL,
            amount REAL NOT NULL,
            equity_percentage REAL NOT NULL DEFAULT 0,
            interest_rate REAL NOT NULL,
            term_months INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            contract_id TEXT,
            start_date TEXT NOT NULL,
            maturity_date TEXT NOT NULL,
            returns_to_date REAL NOT NULL DEFAULT 0,
            next_payout_date TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES investors(id),
            FOREIGN KEY (contract_id) REFERENCES smart_contracts(id)
        )
        "#,
        [],
    )?;

    // Smart contracts table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS smart_contracts (
            id TEXT PRIMARY KEY,
            investment_id TEXT NOT NULL,
            contract_address TEXT,
            terms TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            signed_by_investor INTEGER NOT NULL DEFAULT 0,
            signed_by_company INTEGER NOT NULL DEFAULT 0,
            signed_date TEXT,
            document_hash TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (investment_id) REFERENCES investments(id)
        )
        "#,
        [],
    )?;

    // Payout schedule table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS payout_schedule (
            id TEXT PRIMARY KEY,
            investment_id TEXT NOT NULL,
            investor_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payout_type TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled',
            paid_date TEXT,
            transaction_id TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (investment_id) REFERENCES investments(id),
            FOREIGN KEY (investor_id) REFERENCES investors(id)
        )
        "#,
        [],
    )?;

    // Token transactions table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS token_transactions (
            id TEXT PRIMARY KEY,
            investor_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            amount REAL NOT NULL,
            balance_before REAL NOT NULL,
            balance_after REAL NOT NULL,
            staked_before REAL NOT NULL,
            staked_after REAL NOT NULL,
            reason TEXT,
            blockchain_tx_id TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES investors(id)
        )
        "#,
        [],
    )?;

    // Investor licenses table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS investor_licenses (
            id TEXT PRIMARY KEY,
            investor_id TEXT NOT NULL,
            product TEXT NOT NULL,
            tier TEXT NOT NULL,
            license_key TEXT NOT NULL UNIQUE,
            seats INTEGER NOT NULL DEFAULT 1,
            valid_until TEXT NOT NULL,
            features TEXT,
            activated_domain TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at INTEGER NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES investors(id)
        )
        "#,
        [],
    )?;

    // Investor notifications table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS investor_notifications (
            id TEXT PRIMARY KEY,
            investor_id TEXT NOT NULL,
            notification_type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            action_url TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES investors(id)
        )
        "#,
        [],
    )?;

    // Investment opportunities table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS investment_opportunities (
            id TEXT PRIMARY KEY,
            tier TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            min_investment REAL NOT NULL,
            max_investment REAL NOT NULL,
            target_raise REAL NOT NULL,
            raised_amount REAL NOT NULL DEFAULT 0,
            expected_roi REAL NOT NULL,
            term_months INTEGER NOT NULL,
            benefits TEXT,
            deadline TEXT NOT NULL,
            available_slots INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
        "#,
        [],
    )?;

    // Create indexes for investor tables
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_investors_user_id ON investors(user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_payout_schedule_investor_id ON payout_schedule(investor_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_payout_schedule_status ON payout_schedule(status)",
        [],
    )?;

    Ok(())
}

/// Create affiliate system tables
fn create_affiliate_tables(conn: &Connection) -> Result<()> {
    // Affiliates table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS affiliates (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            email TEXT NOT NULL UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            company TEXT,
            website TEXT,
            tier TEXT NOT NULL DEFAULT 'starter',
            status TEXT NOT NULL DEFAULT 'pending',
            referral_code TEXT NOT NULL UNIQUE,
            custom_domain TEXT,
            branding_enabled INTEGER NOT NULL DEFAULT 0,
            parent_affiliate_id TEXT,
            affiliate_level INTEGER NOT NULL DEFAULT 0,
            total_referrals INTEGER NOT NULL DEFAULT 0,
            active_referrals INTEGER NOT NULL DEFAULT 0,
            total_earnings REAL NOT NULL DEFAULT 0,
            pending_earnings REAL NOT NULL DEFAULT 0,
            paid_earnings REAL NOT NULL DEFAULT 0,
            lifetime_value REAL NOT NULL DEFAULT 0,
            sub_affiliates_count INTEGER NOT NULL DEFAULT 0,
            sub_affiliate_earnings REAL NOT NULL DEFAULT 0,
            payout_method TEXT NOT NULL DEFAULT 'paypal',
            payout_details TEXT,
            minimum_payout REAL NOT NULL DEFAULT 50,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (parent_affiliate_id) REFERENCES affiliates(id)
        )
        "#,
        [],
    )?;

    // Affiliate links table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS affiliate_links (
            id TEXT PRIMARY KEY,
            affiliate_id TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            target_url TEXT NOT NULL,
            utm_campaign TEXT,
            utm_source TEXT,
            utm_medium TEXT,
            clicks INTEGER NOT NULL DEFAULT 0,
            conversions INTEGER NOT NULL DEFAULT 0,
            earnings REAL NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
        )
        "#,
        [],
    )?;

    // Referrals table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS referrals (
            id TEXT PRIMARY KEY,
            affiliate_id TEXT NOT NULL,
            referred_user_id TEXT,
            referred_email TEXT NOT NULL,
            source TEXT NOT NULL,
            landing_page TEXT,
            utm_campaign TEXT,
            utm_source TEXT,
            utm_medium TEXT,
            status TEXT NOT NULL DEFAULT 'clicked',
            subscription_tier TEXT,
            subscription_value REAL NOT NULL DEFAULT 0,
            total_commissions REAL NOT NULL DEFAULT 0,
            ip_address TEXT,
            user_agent TEXT,
            created_at INTEGER NOT NULL,
            converted_at INTEGER,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
        )
        "#,
        [],
    )?;

    // Commissions table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS commissions (
            id TEXT PRIMARY KEY,
            affiliate_id TEXT NOT NULL,
            referral_id TEXT NOT NULL,
            commission_type TEXT NOT NULL,
            amount REAL NOT NULL,
            rate REAL NOT NULL,
            base_amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            status TEXT NOT NULL DEFAULT 'pending',
            payout_id TEXT,
            description TEXT,
            level INTEGER NOT NULL DEFAULT 0,
            source_affiliate_id TEXT,
            created_at INTEGER NOT NULL,
            approved_at INTEGER,
            paid_at INTEGER,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
            FOREIGN KEY (referral_id) REFERENCES referrals(id),
            FOREIGN KEY (payout_id) REFERENCES affiliate_payouts(id)
        )
        "#,
        [],
    )?;

    // Affiliate payouts table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS affiliate_payouts (
            id TEXT PRIMARY KEY,
            affiliate_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            transaction_id TEXT,
            failure_reason TEXT,
            created_at INTEGER NOT NULL,
            processed_at INTEGER,
            completed_at INTEGER,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
        )
        "#,
        [],
    )?;

    // White-label configurations table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS white_label_configs (
            id TEXT PRIMARY KEY,
            affiliate_id TEXT NOT NULL UNIQUE,
            enabled INTEGER NOT NULL DEFAULT 0,
            company_name TEXT NOT NULL,
            logo TEXT,
            favicon TEXT,
            primary_color TEXT NOT NULL DEFAULT '#6366f1',
            secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
            custom_domain TEXT,
            subdomain TEXT,
            ssl_enabled INTEGER NOT NULL DEFAULT 0,
            dns_verified INTEGER NOT NULL DEFAULT 0,
            custom_terms TEXT,
            custom_privacy TEXT,
            support_email TEXT NOT NULL,
            support_url TEXT,
            hide_original_branding INTEGER NOT NULL DEFAULT 0,
            custom_pricing TEXT,
            sub_affiliate_enabled INTEGER NOT NULL DEFAULT 0,
            sub_affiliate_commission REAL NOT NULL DEFAULT 10,
            max_sub_affiliate_levels INTEGER NOT NULL DEFAULT 2,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
        )
        "#,
        [],
    )?;

    // Marketing materials table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS marketing_materials (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            file_type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            preview_url TEXT,
            dimensions TEXT,
            file_size INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )
        "#,
        [],
    )?;

    // Create indexes for affiliate tables
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_affiliates_parent ON affiliates(parent_affiliate_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON referrals(affiliate_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status)",
        [],
    )?;

    Ok(())
}

/// Create SSO/LDAP tables
fn create_sso_tables(conn: &Connection) -> Result<()> {
    // SSO Providers table (SAML, OIDC)
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS sso_providers (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            protocol TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            entity_id TEXT,
            sso_url TEXT,
            slo_url TEXT,
            certificate TEXT,
            client_id TEXT,
            client_secret TEXT,
            authorization_url TEXT,
            token_url TEXT,
            userinfo_url TEXT,
            scopes TEXT,
            attribute_mapping TEXT,
            jit_provisioning INTEGER NOT NULL DEFAULT 1,
            default_role TEXT,
            allowed_domains TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        "#,
        [],
    )?;

    // SSO Sessions table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS sso_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            session_index TEXT,
            name_id TEXT,
            attributes TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY (provider_id) REFERENCES sso_providers(id)
        )
        "#,
        [],
    )?;

    // LDAP Configurations table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS ldap_configs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            server_url TEXT NOT NULL,
            port INTEGER NOT NULL DEFAULT 389,
            use_ssl INTEGER NOT NULL DEFAULT 0,
            use_tls INTEGER NOT NULL DEFAULT 1,
            bind_dn TEXT NOT NULL,
            bind_password TEXT NOT NULL,
            base_dn TEXT NOT NULL,
            user_filter TEXT NOT NULL DEFAULT '(objectClass=user)',
            group_filter TEXT NOT NULL DEFAULT '(objectClass=group)',
            username_attribute TEXT NOT NULL DEFAULT 'sAMAccountName',
            email_attribute TEXT NOT NULL DEFAULT 'mail',
            display_name_attribute TEXT NOT NULL DEFAULT 'displayName',
            group_membership_attribute TEXT NOT NULL DEFAULT 'memberOf',
            sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
            last_sync_at INTEGER,
            sync_status TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        "#,
        [],
    )?;

    // LDAP Groups table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS ldap_groups (
            id TEXT PRIMARY KEY,
            ldap_config_id TEXT NOT NULL,
            distinguished_name TEXT NOT NULL,
            common_name TEXT NOT NULL,
            description TEXT,
            mapped_role TEXT,
            member_count INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (ldap_config_id) REFERENCES ldap_configs(id)
        )
        "#,
        [],
    )?;

    // LDAP Users table (synced from directory)
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS ldap_users (
            id TEXT PRIMARY KEY,
            ldap_config_id TEXT NOT NULL,
            distinguished_name TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT,
            display_name TEXT,
            groups TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            local_user_id TEXT,
            last_sync_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (ldap_config_id) REFERENCES ldap_configs(id)
        )
        "#,
        [],
    )?;

    // SSO/LDAP Audit Log
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS sso_audit_log (
            id TEXT PRIMARY KEY,
            tenant_id TEXT,
            user_id TEXT,
            provider_id TEXT,
            event_type TEXT NOT NULL,
            event_details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            success INTEGER NOT NULL,
            error_message TEXT,
            created_at INTEGER NOT NULL
        )
        "#,
        [],
    )?;

    // Create indexes for SSO tables
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_sso_providers_tenant_id ON sso_providers(tenant_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_sso_sessions_user_id ON sso_sessions(user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_ldap_configs_tenant_id ON ldap_configs(tenant_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_ldap_users_email ON ldap_users(email)",
        [],
    )?;

    Ok(())
}

/// Create multi-tenant system tables
fn create_tenant_tables(conn: &Connection) -> Result<()> {
    // Tenants table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            domain TEXT UNIQUE,
            logo TEXT,
            primary_color TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            subscription_tier TEXT NOT NULL DEFAULT 'starter',
            max_users INTEGER NOT NULL DEFAULT 5,
            max_storage_gb INTEGER NOT NULL DEFAULT 10,
            features TEXT,
            settings TEXT,
            billing_email TEXT,
            billing_address TEXT,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            trial_ends_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
        "#,
        [],
    )?;

    // Tenant users table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenant_users (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            permissions TEXT,
            invited_by TEXT,
            invited_at INTEGER,
            joined_at INTEGER,
            status TEXT NOT NULL DEFAULT 'active',
            last_active_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id),
            UNIQUE (tenant_id, user_id)
        )
        "#,
        [],
    )?;

    // Tenant invitations table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenant_invitations (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            invited_by TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at INTEGER NOT NULL,
            accepted_at INTEGER,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        "#,
        [],
    )?;

    // Tenant roles table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenant_roles (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            permissions TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id),
            UNIQUE (tenant_id, name)
        )
        "#,
        [],
    )?;

    // Tenant audit log
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenant_audit_log (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            old_values TEXT,
            new_values TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        "#,
        [],
    )?;

    // Tenant usage/metrics table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tenant_usage (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            period TEXT NOT NULL,
            users_count INTEGER NOT NULL DEFAULT 0,
            storage_used_bytes INTEGER NOT NULL DEFAULT 0,
            api_calls INTEGER NOT NULL DEFAULT 0,
            automations_run INTEGER NOT NULL DEFAULT 0,
            ai_tokens_used INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id),
            UNIQUE (tenant_id, period)
        )
        "#,
        [],
    )?;

    // Create indexes for tenant tables
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_tenant_id ON tenant_audit_log(tenant_id)",
        [],
    )?;

    Ok(())
}

/// Create browser profile tables
fn create_browser_profile_tables(conn: &Connection) -> Result<()> {
    // Browser profiles table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS browser_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            tenant_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            avatar TEXT,
            color TEXT,
            is_default INTEGER NOT NULL DEFAULT 0,
            proxy_config TEXT,
            user_agent TEXT,
            viewport TEXT,
            timezone TEXT,
            locale TEXT,
            geolocation TEXT,
            cookies_path TEXT,
            storage_path TEXT,
            fingerprint TEXT,
            extensions TEXT,
            startup_urls TEXT,
            last_used_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        "#,
        [],
    )?;

    // Profile sessions table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS browser_profile_sessions (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            tabs TEXT,
            window_state TEXT,
            scroll_positions TEXT,
            form_data TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES browser_profiles(id)
        )
        "#,
        [],
    )?;

    // Profile cookies table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS browser_profile_cookies (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            domain TEXT NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            path TEXT NOT NULL DEFAULT '/',
            expires INTEGER,
            secure INTEGER NOT NULL DEFAULT 0,
            http_only INTEGER NOT NULL DEFAULT 0,
            same_site TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES browser_profiles(id)
        )
        "#,
        [],
    )?;

    // Profile local storage table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS browser_profile_storage (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            origin TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES browser_profiles(id),
            UNIQUE (profile_id, origin, key)
        )
        "#,
        [],
    )?;

    // Profile sync table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS browser_profile_sync (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            device_id TEXT NOT NULL,
            sync_type TEXT NOT NULL,
            data_hash TEXT NOT NULL,
            synced_at INTEGER NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES browser_profiles(id)
        )
        "#,
        [],
    )?;

    // Create indexes for browser profile tables
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_browser_profiles_user_id ON browser_profiles(user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_browser_profiles_tenant_id ON browser_profiles(tenant_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_browser_profile_cookies_profile_id ON browser_profile_cookies(profile_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_browser_profile_storage_profile_id ON browser_profile_storage(profile_id)",
        [],
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_create_extended_tables() {
        let conn = Connection::open_in_memory().unwrap();
        create_extended_tables(&conn).unwrap();

        // Verify tables exist
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table'")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(tables.contains(&"investors".to_string()));
        assert!(tables.contains(&"investments".to_string()));
        assert!(tables.contains(&"affiliates".to_string()));
        assert!(tables.contains(&"sso_providers".to_string()));
        assert!(tables.contains(&"tenants".to_string()));
        assert!(tables.contains(&"browser_profiles".to_string()));
    }
}
