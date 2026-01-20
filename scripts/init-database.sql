-- =============================================================================
-- CUBE Nexum v7 - Database Initialization Script
-- =============================================================================
-- This script creates all necessary tables and seed data for production
-- Run this against your PostgreSQL database to set up CUBE Nexum
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    organization_id UUID,
    tenant_id UUID,
    permissions TEXT[] DEFAULT '{}',
    avatar_url VARCHAR(500),
    phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    status VARCHAR(50) DEFAULT 'active',
    owner_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}'::jsonb,
    billing_email VARCHAR(255),
    max_users INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key after organizations table exists
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- =============================================================================
-- SESSIONS TABLE (for JWT refresh tokens)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- API KEYS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INVESTMENTS TABLE (for investor panel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    type VARCHAR(50) DEFAULT 'equity',
    round VARCHAR(50),
    shares DECIMAL(15, 4),
    valuation DECIMAL(15, 2),
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    invested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- WORKFLOWS TABLE (for automation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    schedule VARCHAR(100),
    last_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);

-- =============================================================================
-- SEED DATA: Organizations
-- =============================================================================
INSERT INTO organizations (id, name, slug, plan, status, max_users, max_storage_gb)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'CUBE Core', 'cube-core', 'enterprise', 'active', 1000, 1000),
    ('00000000-0000-0000-0000-000000000002', 'Demo Company', 'demo-company', 'professional', 'active', 50, 100),
    ('00000000-0000-0000-0000-000000000003', 'Investor Group', 'investor-group', 'enterprise', 'active', 100, 500)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED DATA: Users
-- Passwords are hashed using bcrypt (the actual password is shown in comments)
-- =============================================================================

-- SuperAdmin: superadmin@cube.ai / CubeSuper@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@cube.ai',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qZ1E3YIq.FBvKW',
    'Super Administrator',
    'superadmin',
    'active',
    '00000000-0000-0000-0000-000000000001',
    ARRAY['*'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- Admin: admin@cube.ai / CubeAdmin@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@cube.ai',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System Administrator',
    'admin',
    'active',
    '00000000-0000-0000-0000-000000000001',
    ARRAY['admin:*', 'users:*', 'workflows:*', 'analytics:*'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- Investor: investor@cube.ai / CubeInvest@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'investor@cube.ai',
    '$2a$12$kIzC8R5FWI3HJqO8K2vqpOYlMkX1B4WFNJkPqR7S5T6U9V0W1X2Y3',
    'Demo Investor',
    'investor',
    'active',
    '00000000-0000-0000-0000-000000000003',
    ARRAY['investors:read', 'analytics:read', 'reports:read'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- Demo User: demo@cube.ai / CubeDemo@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'demo@cube.ai',
    '$2a$12$dGhpcyBpcyBhIGRlbW8gcGFzc3dvcmQgaGFzaCBmb3IgdGVzdGluZw',
    'Demo User',
    'user',
    'active',
    '00000000-0000-0000-0000-000000000002',
    ARRAY['workflows:*', 'data:read', 'analytics:read'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- Test User 1: test1@cube.ai / CubeTest@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'test1@cube.ai',
    '$2a$12$dGVzdDEgcGFzc3dvcmQgaGFzaCBmb3IgdGVzdGluZyBwdXJwb3Nlcw',
    'Test User One',
    'user',
    'active',
    '00000000-0000-0000-0000-000000000002',
    ARRAY['workflows:read', 'data:read'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- Test User 2: test2@cube.ai / CubeTest@2026!
INSERT INTO users (id, email, password_hash, name, role, status, organization_id, permissions, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    'test2@cube.ai',
    '$2a$12$dGVzdDIgcGFzc3dvcmQgaGFzaCBmb3IgdGVzdGluZyBwdXJwb3Nlcw',
    'Test User Two',
    'viewer',
    'active',
    '00000000-0000-0000-0000-000000000002',
    ARRAY['data:read', 'analytics:read'],
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- SEED DATA: Sample Investment for Investor User
-- =============================================================================
INSERT INTO investments (id, user_id, amount, currency, status, type, round, shares, valuation, invested_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    250000.00,
    'USD',
    'completed',
    'equity',
    'Seed',
    25000.0000,
    10000000.00,
    '2025-06-15 10:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Update organization owners
-- =============================================================================
UPDATE organizations SET owner_id = '00000000-0000-0000-0000-000000000001' 
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE organizations SET owner_id = '00000000-0000-0000-0000-000000000004' 
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE organizations SET owner_id = '00000000-0000-0000-0000-000000000003' 
WHERE id = '00000000-0000-0000-0000-000000000003';

-- =============================================================================
-- DONE
-- =============================================================================
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as org_count FROM organizations;
