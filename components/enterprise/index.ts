/**
 * Enterprise Components Index
 * 
 * Centralized exports for all enterprise-grade UI components
 * including workflow management, API gateway, pipeline builder,
 * observability, and security dashboards.
 */

// Workflow Components
export { WorkflowDesigner } from './WorkflowDesigner';
export { default as WorkflowDesignerDefault } from './WorkflowDesigner';

// Integration Hub
export { IntegrationHub } from './IntegrationHub';
export { default as IntegrationHubDefault } from './IntegrationHub';

// API Gateway Dashboard
export { APIGatewayDashboard } from './APIGatewayDashboard';
export { default as APIGatewayDashboardDefault } from './APIGatewayDashboard';

// Pipeline Builder
export { PipelineBuilder } from './PipelineBuilder';
export { default as PipelineBuilderDefault } from './PipelineBuilder';

// Observability Dashboard
export { ObservabilityDashboard } from './ObservabilityDashboard';
export { default as ObservabilityDashboardDefault } from './ObservabilityDashboard';

// Security & Compliance Dashboard
export { SecurityDashboard } from './SecurityDashboard';
export { default as SecurityDashboardDefault } from './SecurityDashboard';

// Enterprise Tour
export { EnterpriseTour } from './EnterpriseTour';
export { default as EnterpriseTourDefault } from './EnterpriseTour';

// Contact Management
export { ContactManagement } from './ContactManagement';
export { default as ContactManagementDefault } from './ContactManagement';

// SSO/LDAP Settings
export { SSOSettings } from './SSOSettings';
export { default as SSOSettingsDefault } from './SSOSettings';

// Multi-Tenant Management
export { TenantSettingsPanel } from './TenantSettings';
export { default as TenantSettingsDefault } from './TenantSettings';

// Browser Profile Management
export { BrowserProfiles } from './BrowserProfiles';
export { default as BrowserProfilesDefault } from './BrowserProfiles';

// Re-export types for convenience
export type {
  WorkflowDesignerProps,
} from './WorkflowDesigner';
