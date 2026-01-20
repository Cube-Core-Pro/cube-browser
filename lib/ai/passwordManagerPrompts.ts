/**
 * Password Manager AI Prompts Configuration
 * 
 * This file contains all AI prompts and action mappings for the Password Manager module.
 * These prompts enable the AI assistant to understand user intent and execute actions.
 * 
 * @module lib/ai/passwordManagerPrompts
 */

/**
 * Action types that the AI can trigger for Password Manager
 */
export type PasswordAIActionType = 
  | 'autofill_credentials'
  | 'generate_password'
  | 'add_totp'
  | 'security_scan'
  | 'check_breaches'
  | 'fill_passkey'
  | 'enable_phishing_protection'
  | 'auto_lock'
  | 'export_vault'
  | 'sync_devices'
  | 'enterprise_sso'
  | 'emergency_access'
  | 'save_credentials'
  | 'update_password'
  | 'delete_entry'
  | 'organize_vault'
  | 'share_credential';

/**
 * AI prompt configuration for each action
 */
export interface AIPromptConfig {
  /** Unique identifier for the action */
  actionType: PasswordAIActionType;
  /** Human-readable name */
  displayName: string;
  /** Description of what the action does */
  description: string;
  /** Example prompts that trigger this action */
  triggerPhrases: string[];
  /** Keywords that help identify intent */
  keywords: string[];
  /** System prompt for AI context */
  systemPrompt: string;
  /** Required parameters for the action */
  requiredParams?: string[];
  /** Optional parameters with defaults */
  optionalParams?: Record<string, unknown>;
  /** Icon name for UI display */
  icon: string;
  /** Whether action requires confirmation */
  requiresConfirmation: boolean;
  /** Category for grouping */
  category: 'autofill' | 'security' | 'authentication' | 'management' | 'enterprise';
}

/**
 * Complete AI prompt configurations for Password Manager actions
 */
export const passwordManagerPrompts: AIPromptConfig[] = [
  // ============================================
  // AUTOFILL CATEGORY
  // ============================================
  {
    actionType: 'autofill_credentials',
    displayName: 'Auto-fill Credentials',
    description: 'Automatically fill login credentials on the current website',
    triggerPhrases: [
      'Fill my credentials for this website',
      'Login to this site',
      'Fill in my username and password',
      'Auto-fill this form',
      'Sign me in',
      'Use my saved password',
    ],
    keywords: ['fill', 'credentials', 'login', 'username', 'password', 'sign in', 'autofill'],
    systemPrompt: `You are a secure password manager assistant. When asked to fill credentials:
1. Verify the current website is trusted
2. Check for matching saved credentials
3. Use the inline autofill menu for selection
4. Fill credentials securely without exposing them
5. Log the action for security audit`,
    icon: 'key',
    requiresConfirmation: false,
    category: 'autofill',
  },
  {
    actionType: 'save_credentials',
    displayName: 'Save Credentials',
    description: 'Save new login credentials to the vault',
    triggerPhrases: [
      'Save these credentials',
      'Remember this password',
      'Add this login to my vault',
      'Store this password',
    ],
    keywords: ['save', 'store', 'remember', 'add', 'new credential'],
    systemPrompt: `When saving credentials:
1. Capture username and password securely
2. Detect the website domain
3. Check for duplicate entries
4. Encrypt before storing
5. Offer to generate a stronger password if weak`,
    icon: 'save',
    requiresConfirmation: true,
    category: 'autofill',
  },

  // ============================================
  // SECURITY CATEGORY
  // ============================================
  {
    actionType: 'generate_password',
    displayName: 'Generate Password',
    description: 'Generate a strong, secure random password',
    triggerPhrases: [
      'Generate a strong password',
      'Create a new password',
      'Make me a secure password',
      'Generate password with 20 characters',
      'Create a password with symbols',
    ],
    keywords: ['generate', 'create', 'new', 'strong', 'secure', 'random', 'password'],
    systemPrompt: `When generating passwords:
1. Default to 16+ characters
2. Include uppercase, lowercase, numbers, and symbols
3. Ensure entropy is sufficient
4. Avoid ambiguous characters if requested
5. Copy to clipboard securely`,
    optionalParams: {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    },
    icon: 'sparkles',
    requiresConfirmation: false,
    category: 'security',
  },
  {
    actionType: 'security_scan',
    displayName: 'Security Scan',
    description: 'Analyze all passwords for security vulnerabilities',
    triggerPhrases: [
      'Run a security scan on my passwords',
      'Check my password strength',
      'Find weak passwords',
      'Analyze my vault security',
      'Security health check',
    ],
    keywords: ['scan', 'check', 'analyze', 'weak', 'strength', 'security', 'health'],
    systemPrompt: `When running a security scan:
1. Check all passwords for strength
2. Identify reused passwords
3. Find old/outdated passwords
4. Check for common patterns
5. Generate a security score
6. Prioritize issues by severity`,
    icon: 'shield-check',
    requiresConfirmation: false,
    category: 'security',
  },
  {
    actionType: 'check_breaches',
    displayName: 'Check Data Breaches',
    description: 'Check if any credentials have been exposed in data breaches',
    triggerPhrases: [
      'Check if my passwords have been breached',
      'Have my credentials been exposed',
      'Check for compromised passwords',
      'Have I been pwned',
      'Data breach check',
    ],
    keywords: ['breach', 'exposed', 'compromised', 'pwned', 'leaked', 'hack'],
    systemPrompt: `When checking for breaches:
1. Hash passwords before checking (never send plain text)
2. Use Have I Been Pwned API securely
3. Check email addresses too
4. Report findings with severity
5. Recommend immediate password changes for compromised accounts`,
    icon: 'alert-triangle',
    requiresConfirmation: false,
    category: 'security',
  },
  {
    actionType: 'enable_phishing_protection',
    displayName: 'Phishing Protection',
    description: 'Verify website authenticity and enable protection',
    triggerPhrases: [
      'Check if this website is legitimate',
      'Is this a phishing site',
      'Verify this website',
      'Enable phishing protection',
      'Is this site safe',
    ],
    keywords: ['phishing', 'legitimate', 'fake', 'scam', 'verify', 'safe', 'trust'],
    systemPrompt: `When checking for phishing:
1. Verify domain matches saved credentials
2. Check SSL certificate validity
3. Compare to known phishing databases
4. Analyze page structure for anomalies
5. Block autofill on suspicious sites`,
    icon: 'shield-alert',
    requiresConfirmation: false,
    category: 'security',
  },

  // ============================================
  // AUTHENTICATION CATEGORY
  // ============================================
  {
    actionType: 'add_totp',
    displayName: 'Setup TOTP',
    description: 'Configure two-factor authentication with TOTP',
    triggerPhrases: [
      'Set up TOTP authenticator',
      'Add two-factor authentication',
      'Configure 2FA',
      'Add authenticator code',
      'Enable TOTP for this site',
    ],
    keywords: ['totp', 'authenticator', '2fa', 'two-factor', 'otp', 'google authenticator'],
    systemPrompt: `When setting up TOTP:
1. Scan QR code or accept secret key
2. Validate the TOTP setup with test code
3. Store encrypted secret in vault
4. Generate backup codes
5. Enable auto-copy for codes`,
    icon: 'smartphone',
    requiresConfirmation: true,
    category: 'authentication',
  },
  {
    actionType: 'fill_passkey',
    displayName: 'Passkey Authentication',
    description: 'Use passkey for passwordless authentication',
    triggerPhrases: [
      'Register a passkey',
      'Use passkey to login',
      'Enable passwordless authentication',
      'Sign in with biometrics',
      'Use my fingerprint to login',
    ],
    keywords: ['passkey', 'passwordless', 'biometric', 'fingerprint', 'face id', 'webauthn'],
    systemPrompt: `When handling passkeys:
1. Check WebAuthn support
2. Use platform authenticator when available
3. Create or use existing credential
4. Handle user verification
5. Store passkey metadata securely`,
    icon: 'fingerprint',
    requiresConfirmation: true,
    category: 'authentication',
  },

  // ============================================
  // MANAGEMENT CATEGORY
  // ============================================
  {
    actionType: 'auto_lock',
    displayName: 'Auto-Lock Vault',
    description: 'Configure automatic vault locking',
    triggerPhrases: [
      'Lock my vault automatically',
      'Set auto-lock timer',
      'Configure vault timeout',
      'Lock vault after inactivity',
    ],
    keywords: ['lock', 'auto-lock', 'timeout', 'inactivity', 'secure'],
    systemPrompt: `When configuring auto-lock:
1. Set inactivity timeout
2. Configure lock on minimize
3. Set up clipboard clearing
4. Enable biometric unlock option`,
    optionalParams: {
      timeoutMinutes: 5,
      lockOnMinimize: true,
      clearClipboard: true,
    },
    icon: 'lock',
    requiresConfirmation: true,
    category: 'management',
  },
  {
    actionType: 'export_vault',
    displayName: 'Export Vault',
    description: 'Export vault data in encrypted format',
    triggerPhrases: [
      'Export my vault',
      'Backup my passwords',
      'Download vault data',
      'Create vault backup',
    ],
    keywords: ['export', 'backup', 'download', 'save'],
    systemPrompt: `When exporting vault:
1. Require master password confirmation
2. Encrypt export with strong encryption
3. Support multiple formats (JSON, CSV encrypted)
4. Log export for security audit`,
    icon: 'download',
    requiresConfirmation: true,
    category: 'management',
  },
  {
    actionType: 'sync_devices',
    displayName: 'Sync Devices',
    description: 'Synchronize vault across devices',
    triggerPhrases: [
      'Sync my passwords',
      'Update vault on all devices',
      'Synchronize my vault',
      'Refresh sync',
    ],
    keywords: ['sync', 'synchronize', 'update', 'devices', 'cloud'],
    systemPrompt: `When syncing:
1. Check network connectivity
2. Resolve any conflicts
3. Use end-to-end encryption
4. Update sync timestamp`,
    icon: 'refresh-cw',
    requiresConfirmation: false,
    category: 'management',
  },
  {
    actionType: 'organize_vault',
    displayName: 'Organize Vault',
    description: 'Create folders and organize credentials',
    triggerPhrases: [
      'Organize my passwords',
      'Create a new folder',
      'Move credentials to folder',
      'Clean up my vault',
    ],
    keywords: ['organize', 'folder', 'category', 'move', 'clean'],
    systemPrompt: `When organizing vault:
1. Suggest folder structure
2. Group by domain or category
3. Handle duplicates
4. Apply tags for searching`,
    icon: 'folder',
    requiresConfirmation: false,
    category: 'management',
  },
  {
    actionType: 'emergency_access',
    displayName: 'Emergency Access',
    description: 'Configure trusted contacts for emergency access',
    triggerPhrases: [
      'Set up emergency access',
      'Add trusted contact',
      'Configure recovery contacts',
      'Enable emergency access',
    ],
    keywords: ['emergency', 'access', 'trusted', 'contact', 'recovery'],
    systemPrompt: `When setting up emergency access:
1. Verify trusted contact identity
2. Set waiting period
3. Configure access level
4. Enable notifications`,
    icon: 'users',
    requiresConfirmation: true,
    category: 'management',
  },

  // ============================================
  // ENTERPRISE CATEGORY
  // ============================================
  {
    actionType: 'enterprise_sso',
    displayName: 'Enterprise SSO',
    description: 'Connect with corporate identity provider',
    triggerPhrases: [
      'Connect enterprise SSO',
      'Set up Okta integration',
      'Configure Azure AD',
      'Enable SAML authentication',
      'Connect to corporate login',
    ],
    keywords: ['sso', 'okta', 'azure', 'saml', 'enterprise', 'corporate', 'identity'],
    systemPrompt: `When configuring Enterprise SSO:
1. Detect identity provider
2. Configure SAML/OIDC settings
3. Set up automatic provisioning
4. Enable directory sync
5. Configure access policies`,
    icon: 'building',
    requiresConfirmation: true,
    category: 'enterprise',
  },
  {
    actionType: 'share_credential',
    displayName: 'Share Credential',
    description: 'Securely share credentials with team members',
    triggerPhrases: [
      'Share this password',
      'Send credentials to team',
      'Share access with colleague',
      'Give access to this login',
    ],
    keywords: ['share', 'send', 'team', 'colleague', 'access'],
    systemPrompt: `When sharing credentials:
1. Encrypt with recipient's public key
2. Set expiration if needed
3. Enable view-only or full access
4. Log sharing activity
5. Notify recipient securely`,
    icon: 'share-2',
    requiresConfirmation: true,
    category: 'enterprise',
  },
];

/**
 * Get prompt configuration by action type
 */
export function getPromptConfig(actionType: PasswordAIActionType): AIPromptConfig | undefined {
  return passwordManagerPrompts.find(p => p.actionType === actionType);
}

/**
 * Get all prompts for a specific category
 */
export function getPromptsByCategory(category: AIPromptConfig['category']): AIPromptConfig[] {
  return passwordManagerPrompts.filter(p => p.category === category);
}

/**
 * Find matching action from user input
 */
export function matchUserPrompt(userInput: string): AIPromptConfig | null {
  const inputLower = userInput.toLowerCase();
  
  // First, try to match exact trigger phrases
  for (const config of passwordManagerPrompts) {
    for (const phrase of config.triggerPhrases) {
      if (inputLower.includes(phrase.toLowerCase())) {
        return config;
      }
    }
  }
  
  // Then, try keyword matching with scoring
  let bestMatch: AIPromptConfig | null = null;
  let bestScore = 0;
  
  for (const config of passwordManagerPrompts) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (inputLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = config;
    }
  }
  
  // Require at least 2 keyword matches for confidence
  return bestScore >= 2 ? bestMatch : null;
}

/**
 * Generate AI context for a specific action
 */
export function generateActionContext(actionType: PasswordAIActionType): string {
  const config = getPromptConfig(actionType);
  if (!config) {
    return '';
  }
  
  return `
Action: ${config.displayName}
Description: ${config.description}
Category: ${config.category}

Instructions:
${config.systemPrompt}

Example user requests:
${config.triggerPhrases.map(p => `- "${p}"`).join('\n')}
`;
}

/**
 * Quick action suggestions for the AI interface
 */
export const quickActionSuggestions = [
  {
    id: 'quick-fill',
    title: 'Fill Credentials',
    prompt: 'Fill my credentials for this website',
    icon: 'key',
  },
  {
    id: 'quick-generate',
    title: 'Generate Password',
    prompt: 'Generate a strong password with 20 characters and symbols',
    icon: 'sparkles',
  },
  {
    id: 'quick-scan',
    title: 'Security Scan',
    prompt: 'Run a complete security scan on all my passwords',
    icon: 'shield-check',
  },
  {
    id: 'quick-breach',
    title: 'Check Breaches',
    prompt: 'Check if any of my passwords have been exposed in data breaches',
    icon: 'alert-triangle',
  },
  {
    id: 'quick-totp',
    title: 'Setup 2FA',
    prompt: 'Set up TOTP authenticator for this website',
    icon: 'smartphone',
  },
  {
    id: 'quick-passkey',
    title: 'Use Passkey',
    prompt: 'Register a new passkey for passwordless login',
    icon: 'fingerprint',
  },
];

export default passwordManagerPrompts;
