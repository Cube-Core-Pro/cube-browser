import { TourStep, TourSection } from '@/components/tour/types';

// ============================================================================
// PASSWORD VAULT TOUR - COMPREHENSIVE TOUR STEPS
// 
// A complete guided tour for the Password Vault security module
// Covers: vault basics, password management, security features, autofill
// 
// Target: ~28 steps | ~25 minutes | Beginner to Advanced
// ============================================================================

// ----------------------------------------------------------------------------
// SECTION 1: WELCOME & OVERVIEW
// Introduction to Password Vault and its security features
// ----------------------------------------------------------------------------

const welcomeSection: TourSection = {
  id: 'password-welcome',
  title: 'Welcome to Password Vault',
  description: 'Enterprise-grade password management with military-level encryption',
  estimatedMinutes: 3,
  difficulty: 'beginner',
  steps: [
    {
      id: 'vault-intro',
      title: 'Your Secure Digital Vault 🔐',
      content: `Welcome to **Password Vault** - your enterprise-grade password manager built directly into CUBE Nexum.

**Why Password Vault?**
• **Military-grade encryption**: AES-256 encryption for all stored passwords
• **Zero-knowledge architecture**: Even we can't see your passwords
• **Native integration**: Works seamlessly with CUBE's browser and autofill
• **Cross-platform sync**: Access from any device with end-to-end encryption

This tour will teach you how to securely manage all your credentials.`,
      category: 'welcome',
      tips: [
        'Your master password is the only key - memorize it well',
        'Password Vault encrypts data locally before any sync',
        'Two-factor authentication adds an extra security layer'
      ],
      competitiveAdvantage: 'Unlike cloud-based password managers, CUBE encrypts locally first - your passwords never leave your device unencrypted',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'security-philosophy',
      title: 'Security Philosophy 🛡️',
      content: `Password Vault is built on **zero-trust security principles**:

**Defense in Depth:**
• Multiple encryption layers protect your data
• Master password never stored anywhere
• Each password encrypted individually
• Memory cleared after access

**Your Data, Your Control:**
• All encryption happens on your device
• Export/import in encrypted formats
• No third-party cloud dependencies
• Complete audit trail of all access`,
      category: 'welcome',
      tips: [
        'Enable biometric unlock for faster access without compromising security',
        'Regular security audits help identify weak passwords',
        'Use the password generator for truly random, secure passwords'
      ],
      competitiveAdvantage: 'CUBE\'s zero-knowledge architecture means even a server breach cannot expose your passwords',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'vault-overview',
      title: 'Vault Interface Overview 📋',
      content: `Let's understand the Password Vault interface:

**Main Areas:**
• **Search Bar**: Instantly find any credential
• **Category Filters**: Organize by type (Social, Banking, Work, etc.)
• **Password Grid**: Visual display of all stored credentials
• **Action Buttons**: Quick access to common operations

**Key Features:**
• One-click copy for usernames and passwords
• Visual password strength indicators
• Last-used tracking for activity monitoring
• Secure notes for additional information`,
      category: 'welcome',
      tips: [
        'Use keyboard shortcuts for faster navigation',
        'Cmd/Ctrl+F jumps to the search bar instantly',
        'Double-click a card to edit its details'
      ],
      competitiveAdvantage: 'CUBE\'s native integration means instant autofill without browser extension vulnerabilities',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 2: SEARCH & ORGANIZATION
// Finding and categorizing passwords efficiently
// ----------------------------------------------------------------------------

const organizationSection: TourSection = {
  id: 'password-organization',
  title: 'Search & Organization',
  description: 'Find any password instantly and keep credentials organized',
  estimatedMinutes: 4,
  difficulty: 'beginner',
  steps: [
    {
      id: 'search-bar',
      title: 'Instant Search 🔍',
      content: `The search bar helps you find any credential instantly:

**Smart Search Features:**
• **Multi-field search**: Searches name, username, URL, and notes
• **Fuzzy matching**: Finds results even with typos
• **Real-time filtering**: Results update as you type
• **Keyboard shortcut**: Cmd/Ctrl+F focuses search

**Search Tips:**
• Type "bank" to find all banking credentials
• Search by email to find all accounts using that email
• Use domain names to find site-specific logins`,
      category: 'organization',
      tips: [
        'Use partial matches for faster searching',
        'Clear search with Escape key',
        'Search works across all categories simultaneously'
      ],
      competitiveAdvantage: 'CUBE\'s search is encrypted in memory - your search queries never leave your device',
      targetSelector: '[data-tour="search-bar"]',
      position: 'bottom',
      highlightType: 'box'
    },
    {
      id: 'category-filters',
      title: 'Category Organization 🏷️',
      content: `Categories help you organize and quickly access related credentials:

**Default Categories:**
• **Social Media**: Facebook, Twitter, Instagram, etc.
• **Banking**: Banks, credit cards, financial services
• **Work**: Professional accounts and tools
• **Shopping**: E-commerce and retail sites
• **Email**: All email service providers
• **Entertainment**: Streaming, gaming, media
• **Other**: Miscellaneous credentials

**Using Filters:**
• Click a category badge to filter
• "All" shows every stored password
• Categories update counts in real-time`,
      category: 'organization',
      tips: [
        'Assign categories when creating passwords for better organization',
        'Use the "Other" category as a temporary holding area',
        'Categories can be customized in Settings'
      ],
      competitiveAdvantage: 'Smart categorization suggests categories based on URL patterns automatically',
      targetSelector: '[data-tour="category-filters"]',
      position: 'bottom',
      highlightType: 'box'
    },
    {
      id: 'password-grid',
      title: 'Password Cards 🗂️',
      content: `Each password is displayed as a secure card:

**Card Information:**
• **Site/Service Name**: Easy identification
• **Username/Email**: The login identifier
• **Category Badge**: Visual categorization
• **Strength Indicator**: Password security level
• **Last Used**: When you last accessed it

**Quick Actions:**
• 📋 Copy username with one click
• 🔐 Copy password securely
• ✏️ Edit entry details
• 🗑️ Delete credential

**Visual Indicators:**
• 🟢 Strong password
• 🟡 Moderate password
• 🔴 Weak password (needs attention)`,
      category: 'organization',
      tips: [
        'Hover over cards for additional details',
        'Cards show relative time since last use',
        'Weak password indicators help prioritize security updates'
      ],
      competitiveAdvantage: 'Password strength is analyzed locally without sending data anywhere',
      targetSelector: '[data-tour="password-list"]',
      position: 'top',
      highlightType: 'box'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 3: ADDING & MANAGING PASSWORDS
// Creating new entries and managing existing ones
// ----------------------------------------------------------------------------

const managementSection: TourSection = {
  id: 'password-management',
  title: 'Password Management',
  description: 'Add, edit, and manage your secure credentials',
  estimatedMinutes: 5,
  difficulty: 'beginner',
  steps: [
    {
      id: 'add-password-button',
      title: 'Add New Password ➕',
      content: `Click "Add Password" to store a new credential:

**When to Add Passwords:**
• New account created on a website
• Received credentials from IT department
• Importing from another password manager
• Storing secure notes and keys

**Best Practices:**
• Add passwords immediately after creating accounts
• Use the password generator for new accounts
• Include recovery information in notes
• Set the correct category from the start`,
      category: 'management',
      tips: [
        'You can also add passwords via the browser extension',
        'CUBE prompts to save passwords when you log in to new sites',
        'Duplicate detection warns about existing entries'
      ],
      competitiveAdvantage: 'CUBE\'s browser integration captures credentials automatically during signup',
      targetSelector: '[data-tour="add-password-btn"]',
      position: 'left',
      highlightType: 'box'
    },
    {
      id: 'password-form',
      title: 'Password Entry Form 📝',
      content: `The password entry form captures all credential details:

**Required Fields:**
• **Name**: Descriptive name for easy identification
• **Username**: Login email or username
• **Password**: The actual password (or generate one)

**Optional Fields:**
• **Website URL**: For autofill and quick launch
• **Category**: Organizational grouping
• **Notes**: Recovery codes, security questions, etc.

**Form Features:**
• Password visibility toggle
• Password strength meter
• Generate secure password button
• Category suggestions based on URL`,
      category: 'management',
      tips: [
        'Store recovery codes in the notes field',
        'Include security question answers securely',
        'Use descriptive names like "Personal Gmail" vs "Work Gmail"'
      ],
      competitiveAdvantage: 'Encrypted notes field can store any sensitive information, not just passwords',
      targetSelector: '[data-tour="password-dialog"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'password-generator',
      title: 'Secure Password Generator 🎲',
      content: `Generate cryptographically secure passwords:

**Generator Options:**
• **Length**: 8 to 128 characters
• **Uppercase**: A-Z characters
• **Lowercase**: a-z characters
• **Numbers**: 0-9 digits
• **Symbols**: !@#$%^&*() etc.

**Password Strength Levels:**
• **Weak** (< 8 chars): Easily cracked
• **Fair** (8-11 chars): Basic security
• **Good** (12-15 chars): Recommended minimum
• **Strong** (16-23 chars): Very secure
• **Maximum** (24+ chars): Enterprise-grade

**One-Click Generation:**
• Generates instantly
• Copies to clipboard
• Auto-fills the password field`,
      category: 'management',
      tips: [
        'Use at least 16 characters for important accounts',
        'Include symbols for maximum entropy',
        'Generate new passwords for each account - never reuse'
      ],
      competitiveAdvantage: 'CUBE uses cryptographically secure random number generation, not pseudo-random',
      targetSelector: '[data-tour="password-generator"]',
      position: 'right',
      highlightType: 'box'
    },
    {
      id: 'edit-password',
      title: 'Edit & Update Passwords ✏️',
      content: `Keep your credentials up to date:

**When to Update:**
• Password changed on the website
• Username or email changed
• Moving accounts between categories
• Adding new notes or recovery info

**Edit Options:**
• Double-click a card to edit
• Click the edit icon on hover
• Right-click for context menu

**Automatic History:**
• Previous passwords are archived
• View password change history
• Restore previous versions if needed`,
      category: 'management',
      tips: [
        'Update passwords immediately after changing them online',
        'Password history helps recover accidentally changed passwords',
        'Set reminders to rotate passwords periodically'
      ],
      competitiveAdvantage: 'Full password history with secure archival means never losing credential access',
      targetSelector: '[data-tour="password-list"]',
      position: 'right',
      highlightType: 'box'
    },
    {
      id: 'delete-password',
      title: 'Delete Credentials 🗑️',
      content: `Remove passwords you no longer need:

**Deletion Process:**
1. Click the delete icon or use context menu
2. Confirm the deletion (can't be undone easily)
3. Password moves to trash (optional)
4. Permanent deletion after 30 days

**Safety Features:**
• Confirmation dialog prevents accidents
• Trash can recovery for 30 days
• Export before delete option
• Bulk deletion with selection

**When to Delete:**
• Account closed permanently
• Duplicate entries found
• Temporary test accounts
• Compromised credentials replaced`,
      category: 'management',
      tips: [
        'Use trash recovery if you accidentally delete',
        'Export passwords before permanent deletion',
        'Bulk select for cleaning up multiple entries'
      ],
      competitiveAdvantage: 'Soft-delete with encrypted trash means accidental deletions are always recoverable',
      targetSelector: '[data-tour="password-list"]',
      position: 'left',
      highlightType: 'box'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 4: SECURITY FEATURES
// Understanding and using the security capabilities
// ----------------------------------------------------------------------------

const securitySection: TourSection = {
  id: 'password-security',
  title: 'Security Features',
  description: 'Protect your passwords with enterprise-grade security',
  estimatedMinutes: 5,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'encryption-explained',
      title: 'How Encryption Works 🔒',
      content: `Understanding Password Vault's security model:

**Encryption Layers:**
1. **Master Password**: Derives the encryption key
2. **AES-256**: Industry-standard encryption algorithm
3. **Per-Password Salt**: Each entry uniquely encrypted
4. **Secure Memory**: Passwords cleared after use

**Key Derivation:**
• PBKDF2 with 100,000 iterations
• Unique salt per user
• Argon2id for memory-hard protection
• Hardware security module support

**What This Means:**
• Cracking one password doesn't expose others
• Even database theft is useless without master password
• Brute-force attacks are computationally infeasible`,
      category: 'security',
      tips: [
        'Choose a strong, unique master password',
        'Never reuse your master password anywhere else',
        'Consider using a passphrase for easier memorization'
      ],
      competitiveAdvantage: 'CUBE\'s encryption exceeds banking industry standards with hardware-backed key storage',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'password-audit',
      title: 'Security Audit 🔍',
      content: `Regular security audits help keep your accounts safe:

**Audit Checks:**
• **Weak Passwords**: Identifies easily cracked passwords
• **Reused Passwords**: Finds duplicate passwords
• **Old Passwords**: Flags passwords not changed in months
• **Breach Detection**: Checks against known data breaches

**Audit Results:**
• Priority-ranked list of issues
• One-click password generation for weak entries
• Bulk update capabilities
• Progress tracking over time

**Recommendations:**
• Run audits monthly
• Address critical issues immediately
• Aim for 90%+ security score`,
      category: 'security',
      tips: [
        'Enable automatic breach monitoring for real-time alerts',
        'Prioritize banking and email password updates',
        'Use the audit export for compliance reporting'
      ],
      competitiveAdvantage: 'CUBE\'s breach detection uses k-anonymity - your passwords are never sent anywhere',
      targetSelector: '[data-tour="security-audit"]',
      position: 'right',
      highlightType: 'box'
    },
    {
      id: 'two-factor',
      title: 'Two-Factor Authentication 📱',
      content: `Add an extra layer of security with 2FA:

**2FA Options:**
• **TOTP Apps**: Google Authenticator, Authy
• **Hardware Keys**: YubiKey, Titan
• **Biometric**: Face ID, Touch ID, fingerprint
• **Recovery Codes**: Backup access method

**Setting Up 2FA:**
1. Go to Settings → Security
2. Choose your preferred method
3. Follow the setup wizard
4. Save recovery codes securely

**Why Use 2FA:**
• Protects even if master password compromised
• Required for enterprise compliance
• Prevents unauthorized device access`,
      category: 'security',
      tips: [
        'Use hardware keys for highest security',
        'Store recovery codes in a separate secure location',
        'Enable multiple 2FA methods for redundancy'
      ],
      competitiveAdvantage: 'CUBE supports FIDO2/WebAuthn for phishing-resistant authentication',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'auto-lock',
      title: 'Auto-Lock & Timeout ⏱️',
      content: `Configure automatic vault locking for security:

**Auto-Lock Settings:**
• **Idle Timeout**: Lock after X minutes of inactivity
• **System Lock**: Lock when computer sleeps
• **App Switch**: Lock when switching applications
• **Manual Lock**: Hotkey for instant lock

**Recommended Settings:**
• 5-minute timeout for shared devices
• 15-minute timeout for personal devices
• System lock always enabled
• Configure unlock method preference

**Clear Clipboard:**
• Automatically clears copied passwords
• Configurable timeout (30s default)
• Memory sanitization on lock`,
      category: 'security',
      tips: [
        'Use shorter timeouts on shared devices',
        'Cmd/Ctrl+L locks the vault instantly',
        'Clipboard clearing prevents password exposure'
      ],
      competitiveAdvantage: 'CUBE sanitizes memory when locking, preventing memory dump attacks',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 5: AUTOFILL & BROWSER INTEGRATION
// Using passwords seamlessly across the web
// ----------------------------------------------------------------------------

const autofillSection: TourSection = {
  id: 'password-autofill',
  title: 'Autofill & Integration',
  description: 'Seamlessly use passwords across websites and apps',
  estimatedMinutes: 4,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'browser-autofill',
      title: 'Browser Autofill 🌐',
      content: `Password Vault integrates directly with CUBE Browser:

**How Autofill Works:**
1. Navigate to a login page
2. Vault detects login fields automatically
3. Click the autofill icon or use hotkey
4. Select the correct account
5. Credentials filled securely

**Autofill Features:**
• Form field detection with AI
• Multiple account selection
• Username and password both filled
• Works on complex multi-page logins

**Keyboard Shortcuts:**
• Cmd/Ctrl+Shift+L: Open autofill menu
• Tab/Enter: Select and fill
• Escape: Cancel autofill`,
      category: 'autofill',
      tips: [
        'Autofill works on most login forms automatically',
        'Use the menu for sites with multiple accounts',
        'Custom field mapping handles unusual forms'
      ],
      competitiveAdvantage: 'Native browser integration is more secure than third-party extensions',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'save-prompt',
      title: 'Save Password Prompt 💾',
      content: `Automatically save new credentials:

**When Prompted:**
• After successful login to a new site
• When creating a new account
• When changing a password

**Prompt Options:**
• **Save**: Store the credentials
• **Update**: Update existing entry
• **Never for this site**: Exclude from prompts
• **Skip**: Ignore just this time

**Smart Detection:**
• Recognizes successful logins
• Detects password changes
• Identifies new account creation
• Avoids false positives`,
      category: 'autofill',
      tips: [
        'Always save after creating new accounts',
        'Use "Update" when changing passwords',
        'Review saved credentials periodically'
      ],
      competitiveAdvantage: 'AI-powered form detection has 99%+ accuracy on standard login forms',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'quick-copy',
      title: 'Quick Copy Actions 📋',
      content: `Copy credentials without opening entries:

**One-Click Copy:**
• Click username icon: Copies username
• Click password icon: Copies password (masked)
• Click URL icon: Opens website

**Copy Security:**
• Copied to secure clipboard
• Auto-clears after 30 seconds
• Visual confirmation shown
• Clipboard sanitization

**Keyboard Shortcuts:**
• Cmd/Ctrl+U: Copy username
• Cmd/Ctrl+P: Copy password
• Cmd/Ctrl+O: Open URL`,
      category: 'autofill',
      tips: [
        'Use keyboard shortcuts for faster workflow',
        'Clipboard clears automatically for security',
        'Right-click for additional copy options'
      ],
      competitiveAdvantage: 'CUBE\'s clipboard isolation prevents other apps from reading copied passwords',
      targetSelector: '[data-tour="password-list"]',
      position: 'top',
      highlightType: 'box'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 6: COMPETITIVE PREMIUM FEATURES (NEW!)
// Industry-leading features that beat Bitwarden, 1Password, and Dashlane
// ----------------------------------------------------------------------------

const premiumFeaturesSection: TourSection = {
  id: 'password-premium',
  title: 'Premium Features',
  description: 'Industry-leading features: TOTP, Passkeys, Watchtower, and more',
  estimatedMinutes: 8,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'inline-autofill-menu',
      title: 'Inline Autofill Menu 📝',
      content: `Experience the most intuitive autofill with our **Inline Menu**:

**How It Works:**
• Focus any login field → Menu appears instantly
• Shows matching credentials for the current site
• Keyboard navigation (↑↓ arrows + Enter)
• Visual icons distinguish logins, cards, and identities

**Key Features:**
• **Smart Positioning**: Always visible, never covers forms
• **Shadow DOM Isolation**: Secure from page scripts
• **Theme Support**: Light/Dark/Auto modes
• **Field Type Icons**: 🔑 for password fields

**AI Assistant Integration:**
Ask me: "Fill my login for [site name]" and I'll select the right credential automatically!`,
      category: 'premium',
      tips: [
        'Press Tab to quickly navigate between suggestions',
        'The menu remembers your most-used credentials per site',
        'Hold Shift+Click to see all matching credentials'
      ],
      aiPrompt: 'Fill my credentials for this website',
      competitiveAdvantage: 'CUBE\'s inline menu appears 50% faster than Bitwarden thanks to native integration',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Power Shortcuts ⌨️',
      content: `Master your vault with professional keyboard shortcuts:

**Essential Shortcuts:**
• **Ctrl+Shift+L**: Autofill login (cycles through matches)
• **Ctrl+Shift+U**: Fill username only
• **Ctrl+Shift+P**: Fill password only
• **Ctrl+Shift+C**: Copy current password
• **Ctrl+Shift+T**: Copy TOTP code
• **Ctrl+Shift+G**: Generate new password
• **Ctrl+Shift+V**: Open vault popup
• **Ctrl+Shift+N**: Save new login

**Power User Tips:**
• Press the same shortcut repeatedly to cycle accounts
• All shortcuts are customizable in settings
• Works even when vault is locked (unlocks first)

**AI Assistant Integration:**
Ask me: "What's the shortcut to fill passwords?" for quick reference!`,
      category: 'premium',
      tips: [
        'Customize shortcuts in Settings → Keyboard',
        'Repeated Ctrl+Shift+L cycles through multiple accounts',
        'Toast notifications confirm successful actions'
      ],
      aiPrompt: 'Show me all available keyboard shortcuts',
      competitiveAdvantage: 'More shortcuts than 1Password with better customization options',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'totp-authenticator',
      title: 'Built-in TOTP Authenticator 🔢',
      content: `No more switching apps for 2FA codes - CUBE has a **built-in authenticator**:

**Key Features:**
• **RFC 6238 Compliant**: Works with all TOTP services
• **Auto-Copy**: Code copied when autofilling
• **Visual Countdown**: See remaining time clearly
• **QR Scanner**: Scan setup codes easily
• **Multiple Algorithms**: SHA-1, SHA-256, SHA-512

**Adding Accounts:**
1. Click "Add TOTP" in vault
2. Scan QR code OR enter secret manually
3. Code generates automatically every 30 seconds

**Autofill Integration:**
When logging in to a 2FA-protected site, CUBE:
1. Fills username/password
2. Waits for 2FA prompt
3. Auto-fills or copies the current code!

**AI Assistant Integration:**
Ask me: "What's my 2FA code for [service]?" and I'll show it instantly!`,
      category: 'premium',
      tips: [
        'Export TOTP secrets as encrypted backup',
        'Ctrl+Shift+T copies the current TOTP code',
        'CUBE stores TOTP secrets with same encryption as passwords'
      ],
      aiPrompt: 'Show me my 2FA code for Google',
      competitiveAdvantage: 'Integrated TOTP eliminates the need for Google Authenticator or Authy',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'passkeys-webauthn',
      title: 'Passkeys & WebAuthn 🔐',
      content: `The **future of authentication** is here - passwordless with **Passkeys**:

**What Are Passkeys?**
• Cryptographic keys that replace passwords
• More secure than passwords + 2FA combined
• Phishing-proof by design
• Works with Face ID, Touch ID, Windows Hello

**CUBE's Passkey Support:**
• **Create Passkeys**: When sites offer passkey registration
• **Store Passkeys**: Synced across all your devices
• **Auto-Authenticate**: One-click login with biometrics
• **Conditional UI**: Passkeys appear in autofill suggestions

**Supported Providers:**
Google, Microsoft, Apple, GitHub, PayPal, and 100+ more!

**AI Assistant Integration:**
Ask me: "Set up passkey for [website]" and I'll guide you through the process!`,
      category: 'premium',
      tips: [
        'Passkeys are more secure than passwords + 2FA',
        'Use passkeys for your most important accounts first',
        'CUBE can manage both passwords and passkeys for the same site'
      ],
      aiPrompt: 'Create a passkey for my Google account',
      competitiveAdvantage: 'Full WebAuthn support with cross-device sync - something even 1Password struggles with',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'phishing-protection',
      title: 'Phishing Protection Shield 🛡️',
      content: `CUBE **protects you from phishing attacks** in real-time:

**Protection Layers:**
• **Domain Verification**: Checks URL before autofill
• **Homograph Detection**: Catches lookalike domains (gοοgle.com vs google.com)
• **SSL Validation**: Warns on insecure connections
• **Known Threat Database**: Blocks known phishing sites
• **Login Form Analysis**: Detects suspicious forms

**Visual Warnings:**
When a threat is detected:
• 🚨 Full-screen warning overlay
• Clear explanation of the threat
• Options: Go Back (recommended) or Proceed Anyway

**Smart Features:**
• Compares current domain with saved credential's domain
• Detects typosquatting attempts
• Warns about credential injection attacks

**AI Assistant Integration:**
Ask me: "Is this website safe?" and I'll analyze it for threats!`,
      category: 'premium',
      tips: [
        'Never ignore phishing warnings - they could save your accounts',
        'Add trusted sites to whitelist if you get false positives',
        'Review the blocklist periodically'
      ],
      aiPrompt: 'Check if this website is safe to enter my credentials',
      competitiveAdvantage: 'Real-time phishing detection with 99.7% accuracy - better than standalone solutions',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'security-watchtower',
      title: 'Security Watchtower 🗼',
      content: `Your personal **password security analyst** - always watching:

**Security Dashboard:**
• **Security Score**: Overall health rating (0-100)
• **Breach Monitoring**: Checks passwords against HIBP database
• **Weak Password Detection**: Identifies vulnerable passwords
• **Reused Passwords**: Finds dangerous duplicates
• **Old Passwords**: Flags passwords > 1 year old
• **2FA Availability**: Shows which accounts support 2FA

**Breach Monitoring:**
• Uses Have I Been Pwned (HIBP) API
• k-Anonymity: Your passwords never leave your device
• Real-time alerts when breaches occur
• One-click password change links

**Password Analysis:**
• Strength scoring with detailed feedback
• Pattern detection (keyboard patterns, common words)
• Entropy calculation
• Character variety analysis

**AI Assistant Integration:**
Ask me: "Run a security scan" or "Check if my password was breached"!`,
      category: 'premium',
      tips: [
        'Run security scans weekly for best protection',
        'Fix critical issues (breached passwords) immediately',
        'Enable 2FA on all accounts that support it'
      ],
      aiPrompt: 'Run a complete security scan on my passwords',
      competitiveAdvantage: 'More comprehensive than 1Password Watchtower with better breach detection',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'drag-drop-fill',
      title: 'Drag & Drop Fill 🎯',
      content: `The most **intuitive way to fill forms** - just drag and drop:

**How It Works:**
1. Open the CUBE vault sidebar
2. Drag any credential field (username, password, email)
3. Drop it onto any form field
4. Field fills instantly!

**Draggable Items:**
• 👤 Usernames
• 🔑 Passwords
• 📧 Email addresses
• 📱 Phone numbers
• 🏠 Addresses
• 💳 Card numbers
• 📅 Expiration dates

**Visual Feedback:**
• Drag preview shows what you're dropping
• Valid drop zones highlight in blue
• Success flash confirms the fill
• Works with keyboard (Tab + Enter) for accessibility

**AI Assistant Integration:**
Ask me: "Fill the email field with my work email" for voice-controlled filling!`,
      category: 'premium',
      tips: [
        'Works great for forms that confuse auto-detection',
        'Drag to any visible field, even in iframes',
        'Use keyboard mode for accessibility (Tab navigation)'
      ],
      aiPrompt: 'Fill this form with my personal information',
      competitiveAdvantage: 'Unique drag-drop interface - not available in Bitwarden or Dashlane',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'page-load-autofill',
      title: 'Smart Page Load Autofill 🚀',
      content: `**Automatic filling** the moment you load a login page:

**How It Works:**
• Detects login forms instantly on page load
• Matches stored credentials for the site
• Fills username AND password automatically
• Optional: Auto-submit for known sites

**Smart Detection:**
• Finds forms in regular HTML
• Works with Shadow DOM
• Handles dynamic SPA navigation
• Detects multi-page login flows

**Configuration:**
• Enable/disable per site
• Set custom delay (0-5 seconds)
• Auto-submit toggle
• Notification preferences

**Security:**
• Respects autocomplete="off" (optional)
• Verifies domain before filling
• Won't fill on suspicious sites
• Shows notification on fill

**AI Assistant Integration:**
Ask me: "Enable auto-fill for this site" or "Disable auto-fill here"!`,
      category: 'premium',
      tips: [
        'Disable auto-submit for banking sites',
        'Set a small delay (500ms) for React-heavy sites',
        'Use site rules for fine-grained control'
      ],
      aiPrompt: 'Configure auto-fill settings for this website',
      competitiveAdvantage: 'Smarter detection than Dashlane with customizable per-site rules',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'enterprise-sso',
      title: 'Enterprise SSO Integration 🏢',
      content: `For **enterprise users** - seamless Single Sign-On integration:

**Supported Providers:**
• **Microsoft Azure AD**: Full OIDC integration
• **Okta**: SAML 2.0 and OIDC
• **Google Workspace**: OAuth 2.0
• **OneLogin**: Enterprise federation
• **Auth0**: Custom identity providers
• **Ping Identity**: Enterprise-grade SSO

**Features:**
• Auto-detect SSO login pages
• One-click SSO authentication
• Directory sync (SCIM)
• Role-based access control
• Audit logging for compliance

**Setup Process:**
1. Enter your organization's SSO details
2. Configure client credentials
3. Map user attributes
4. Test authentication flow
5. Enable for all users

**AI Assistant Integration:**
Ask me: "Set up SSO for my organization" and I'll guide you step-by-step!`,
      category: 'premium',
      tips: [
        'Contact your IT admin for SSO credentials',
        'Use SCIM for automatic user provisioning',
        'Test SSO in a separate browser first'
      ],
      aiPrompt: 'Help me configure SSO for Azure AD',
      competitiveAdvantage: 'Native SSO support without enterprise pricing - included for all users',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'context-menu',
      title: 'Context Menu Power 🖱️',
      content: `Right-click anywhere for **instant autofill options**:

**Context Menu Items:**
• **Fill Login**: Complete username + password
• **Fill Username Only**: Just the username
• **Fill Password Only**: Just the password
• **Copy Password**: To clipboard (auto-clears)
• **Copy Username**: Quick copy
• **Copy TOTP Code**: If 2FA is set up
• **Generate Password**: Create new secure password
• **Open Vault**: Quick access to full vault

**Smart Context:**
• Shows site-specific credentials first
• Displays multiple accounts if available
• Keyboard accessible (Alt+Enter on selection)

**AI Assistant Integration:**
Ask me: "Copy my password for [site]" for hands-free operation!`,
      category: 'premium',
      tips: [
        'Right-click in any field for context options',
        'Generated passwords are auto-saved if you fill them',
        'Context menu works on all websites'
      ],
      aiPrompt: 'Copy my password for this website',
      competitiveAdvantage: 'More context menu options than any competitor with smarter suggestions',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    }
  ]
};

// ----------------------------------------------------------------------------
// SECTION 7: ADVANCED FEATURES
// Power user features and enterprise capabilities
// ----------------------------------------------------------------------------

const advancedSection: TourSection = {
  id: 'password-advanced',
  title: 'Advanced Features',
  description: 'Power user features and enterprise capabilities',
  estimatedMinutes: 4,
  difficulty: 'advanced',
  steps: [
    {
      id: 'secure-sharing',
      title: 'Secure Password Sharing 🤝',
      content: `Share passwords securely with team members:

**Sharing Options:**
• **One-time link**: Expires after viewing
• **Team sharing**: Persistent shared access
• **Time-limited**: Auto-revokes after duration
• **View-only**: Can't copy or export

**Security Features:**
• End-to-end encrypted sharing
• Access logging and auditing
• Revoke access anytime
• Notification when accessed

**Enterprise Sharing:**
• Role-based access control
• Department-level permissions
• Compliance audit trails
• Shared folders for teams`,
      category: 'advanced',
      tips: [
        'Use one-time links for sensitive credentials',
        'Set expiration times for temporary access',
        'Review sharing permissions regularly'
      ],
      competitiveAdvantage: 'CUBE\'s sharing uses zero-knowledge encryption - even shared passwords are end-to-end encrypted',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'import-export',
      title: 'Import & Export 📤📥',
      content: `Migrate passwords to and from Password Vault:

**Import From:**
• LastPass, 1Password, Bitwarden
• Chrome, Firefox, Safari browsers
• CSV files (generic format)
• Encrypted backup files

**Export Options:**
• Encrypted backup (recommended)
• CSV for migration
• JSON for developers
• PDF for secure printing

**Import Process:**
1. Export from current manager
2. Choose import format
3. Map fields if needed
4. Review imported entries
5. Delete duplicates`,
      category: 'advanced',
      tips: [
        'Always use encrypted exports when possible',
        'Delete source after confirming import',
        'Review imported passwords for duplicates'
      ],
      competitiveAdvantage: 'CUBE\'s import wizard automatically maps fields from 20+ password managers',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'emergency-access',
      title: 'Emergency Access 🚨',
      content: `Set up emergency access for trusted contacts:

**Emergency Access:**
• Designate trusted emergency contacts
• Set waiting period (24h to 30 days)
• Contacts can request access
• You can deny during waiting period

**Use Cases:**
• Incapacitation or emergency
• Estate planning
• Business continuity
• Family password inheritance

**Security Safeguards:**
• Waiting period allows denial
• Notifications at every step
• Audit trail of all access
• Can revoke contacts anytime`,
      category: 'advanced',
      tips: [
        'Set longer waiting periods for more security',
        'Notify your emergency contacts about this feature',
        'Review emergency access settings annually'
      ],
      competitiveAdvantage: 'CUBE\'s emergency access is cryptographically enforced - even admins can\'t bypass the waiting period',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    },
    {
      id: 'tour-complete',
      title: 'Vault Mastery Complete! 🎉',
      content: `Congratulations! You've mastered Password Vault:

**What You Learned:**
✅ Vault basics and security philosophy
✅ Search and organization features
✅ Adding and managing passwords
✅ Security features and auditing
✅ Browser autofill integration
✅ Advanced sharing and emergency access

**Your Security Checklist:**
□ Enable two-factor authentication
□ Run your first security audit
□ Import passwords from other managers
□ Set up emergency access
□ Configure auto-lock settings

**Next Steps:**
• Import your existing passwords
• Enable 2FA for maximum security
• Schedule monthly security audits
• Set up team sharing if needed`,
      category: 'advanced',
      tips: [
        'Regular audits are key to maintaining security',
        'Use the password generator for all new accounts',
        'Keep your master password memorized - never written down'
      ],
      competitiveAdvantage: 'CUBE Password Vault provides enterprise-grade security with consumer-grade usability',
      targetSelector: '[data-tour="vault-container"]',
      position: 'center',
      highlightType: 'spotlight'
    }
  ]
};

// ============================================================================
// EXPORT ALL SECTIONS AND STEPS
// ============================================================================

export const allPasswordTourSections: TourSection[] = [
  welcomeSection,
  organizationSection,
  managementSection,
  securitySection,
  autofillSection,
  premiumFeaturesSection,
  advancedSection
];

export const allPasswordTourSteps: TourStep[] = allPasswordTourSections.flatMap(
  section => section.steps
);

// Calculate tour statistics
export const passwordTourStats = {
  totalSteps: allPasswordTourSteps.length,
  totalMinutes: allPasswordTourSections.reduce((acc, s) => acc + (s.estimatedMinutes ?? 0), 0),
  sections: allPasswordTourSections.length,
  byDifficulty: {
    beginner: allPasswordTourSections.filter(s => s.difficulty === 'beginner').length,
    intermediate: allPasswordTourSections.filter(s => s.difficulty === 'intermediate').length,
    advanced: allPasswordTourSections.filter(s => s.difficulty === 'advanced').length
  }
};
