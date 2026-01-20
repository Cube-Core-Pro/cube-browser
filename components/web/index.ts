// Web-specific components for CUBE Nexum
// These components use REST APIs instead of Tauri commands
// for use in the web deployment (Railway, Vercel, etc.)

export { WebAIChat } from './WebAIChat';
export { SalesChatWidget } from './SalesChatWidget';

// Re-export types if needed
export type { } from './WebAIChat';
