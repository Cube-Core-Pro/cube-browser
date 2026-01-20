/**
 * CUBE Nexum - Legal Settings API
 * 
 * SuperAdmin endpoint for managing all legal documents:
 * - Terms of Service
 * - Privacy Policy
 * - Cookie Policy
 * - GDPR Compliance
 * - Refund Policy
 * - Acceptable Use Policy
 * - Data Processing Agreement
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface LegalDocument {
  id: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  isActive: boolean;
  requiresAcceptance: boolean;
  translations: Record<string, {
    title: string;
    content: string;
  }>;
}

interface LegalSettings {
  companyName: string;
  companyLegalName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyRegistrationNumber: string;
  companyVatNumber: string;
  companyEmail: string;
  companyPhone: string;
  dataProtectionOfficer: string;
  dpoEmail: string;
  documents: LegalDocument[];
}

// ============================================================================
// DEFAULT LEGAL SETTINGS
// ============================================================================

const defaultLegalSettings: LegalSettings = {
  companyName: 'CUBE AI',
  companyLegalName: 'CUBE AI Technologies Inc.',
  companyAddress: '123 Innovation Drive, Suite 500',
  companyCity: 'San Francisco, CA 94105',
  companyCountry: 'United States',
  companyRegistrationNumber: 'DE-123456789',
  companyVatNumber: 'US123456789',
  companyEmail: 'legal@cubeai.tools',
  companyPhone: '+1 (555) 123-4567',
  dataProtectionOfficer: 'Privacy Officer',
  dpoEmail: 'dpo@cubeai.tools',
  documents: [
    {
      id: 'terms-of-service',
      title: 'Terms of Service',
      slug: 'terms',
      content: `# Terms of Service

Last updated: {{effectiveDate}}

## 1. Introduction

Welcome to {{companyName}} ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our products and services.

## 2. Acceptance of Terms

By accessing or using our services, you agree to be bound by these Terms. If you do not agree, you may not use our services.

## 3. Description of Services

{{companyName}} provides:
- CUBE Nexum: Desktop browser automation platform
- CubeMail: Free private email service
- CUBE Core: Enterprise cloud solutions (coming soon)

## 4. User Accounts

You must provide accurate information when creating an account. You are responsible for maintaining the security of your account.

## 5. Acceptable Use

You agree not to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit harmful or malicious content
- Attempt to gain unauthorized access

## 6. Payment Terms

Paid services are billed according to the plan selected. All fees are non-refundable except as specified in our Refund Policy.

## 7. Intellectual Property

All content and materials on our platform are owned by {{companyLegalName}} or its licensors.

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, {{companyName}} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.

## 9. Governing Law

These Terms are governed by the laws of {{companyCountry}}.

## 10. Contact

For questions about these Terms, contact us at {{companyEmail}}.

---

{{companyLegalName}}
{{companyAddress}}
{{companyCity}}, {{companyCountry}}`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: true,
      translations: {}
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      slug: 'privacy',
      content: `# Privacy Policy

Last updated: {{effectiveDate}}

## 1. Introduction

{{companyLegalName}} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your information.

## 2. Information We Collect

### 2.1 Information You Provide
- Account information (name, email, password)
- Payment information (processed by Stripe)
- Communications with us

### 2.2 Information We Collect Automatically
- Usage data and analytics
- Device information
- Log data

## 3. How We Use Your Information

We use your information to:
- Provide and improve our services
- Process transactions
- Send important updates
- Respond to support requests

## 4. Data Sharing

We do not sell your personal data. We may share data with:
- Service providers (hosting, payments)
- Legal authorities when required

## 5. Data Security

We implement industry-standard security measures including:
- TLS 1.3 encryption
- SOC2 compliance
- Regular security audits

## 6. Your Rights

You have the right to:
- Access your data
- Correct inaccurate data
- Delete your data
- Export your data
- Opt-out of marketing

## 7. GDPR Compliance

For EU residents, we comply with GDPR regulations. Our Data Protection Officer can be reached at {{dpoEmail}}.

## 8. Cookie Policy

See our separate Cookie Policy for details on how we use cookies.

## 9. Children's Privacy

Our services are not intended for children under 16.

## 10. Changes to This Policy

We may update this policy periodically. We will notify you of significant changes.

## 11. Contact Us

Data Protection Officer: {{dataProtectionOfficer}}
Email: {{dpoEmail}}

{{companyLegalName}}
{{companyAddress}}
{{companyCity}}, {{companyCountry}}`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: true,
      translations: {}
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy',
      slug: 'cookies',
      content: `# Cookie Policy

Last updated: {{effectiveDate}}

## 1. What Are Cookies

Cookies are small text files stored on your device when you visit our website.

## 2. Types of Cookies We Use

### 2.1 Essential Cookies
Required for basic functionality. Cannot be disabled.

### 2.2 Analytics Cookies
Help us understand how visitors use our site.

### 2.3 Preference Cookies
Remember your settings and preferences.

### 2.4 Marketing Cookies
Used for targeted advertising (optional).

## 3. Managing Cookies

You can control cookies through:
- Browser settings
- Our cookie consent banner
- Third-party opt-out tools

## 4. Contact

For questions, contact {{companyEmail}}.`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: false,
      translations: {}
    },
    {
      id: 'refund-policy',
      title: 'Refund Policy',
      slug: 'refunds',
      content: `# Refund Policy

Last updated: {{effectiveDate}}

## 1. 14-Day Money-Back Guarantee

We offer a 14-day money-back guarantee for all paid plans.

## 2. Eligibility

To be eligible for a refund:
- Request within 14 days of purchase
- First-time subscribers only
- No policy violations

## 3. How to Request

Email {{companyEmail}} with your account details.

## 4. Processing Time

Refunds are processed within 5-10 business days.

## 5. Exceptions

The following are non-refundable:
- Enterprise custom contracts
- Add-on purchases after 14 days
- Accounts terminated for violations`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: false,
      translations: {}
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      slug: 'acceptable-use',
      content: `# Acceptable Use Policy

Last updated: {{effectiveDate}}

## 1. Purpose

This policy outlines acceptable use of {{companyName}} services.

## 2. Prohibited Activities

You may NOT use our services to:
- Engage in illegal activities
- Send spam or unsolicited messages
- Distribute malware or harmful content
- Violate intellectual property rights
- Harass or harm others
- Attempt unauthorized access
- Circumvent security measures
- Scrape protected content without permission

## 3. Resource Usage

- Respect rate limits
- Do not abuse API endpoints
- Report vulnerabilities responsibly

## 4. Enforcement

Violations may result in:
- Warning
- Temporary suspension
- Permanent termination
- Legal action

## 5. Reporting

Report violations to {{companyEmail}}.`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: true,
      translations: {}
    },
    {
      id: 'dpa',
      title: 'Data Processing Agreement',
      slug: 'dpa',
      content: `# Data Processing Agreement

Last updated: {{effectiveDate}}

## 1. Parties

This Data Processing Agreement ("DPA") is between {{companyLegalName}} ("Processor") and the Customer ("Controller").

## 2. Definitions

- "Personal Data" means any information relating to an identified or identifiable natural person.
- "Processing" means any operation performed on Personal Data.

## 3. Scope

This DPA applies to all Personal Data processed by the Processor on behalf of the Controller.

## 4. Processor Obligations

The Processor shall:
- Process data only on documented instructions
- Ensure personnel confidentiality
- Implement appropriate security measures
- Assist with data subject requests
- Delete or return data upon termination
- Allow and contribute to audits

## 5. Sub-processors

Current sub-processors:
- AWS (hosting)
- Stripe (payments)
- SendGrid (email)

## 6. Data Transfers

International transfers comply with applicable laws including Standard Contractual Clauses.

## 7. Security Measures

- Encryption at rest and in transit
- Access controls
- Regular security assessments
- Incident response procedures

## 8. Breach Notification

We will notify you of breaches within 72 hours.

## 9. Contact

Data Protection Officer: {{dataProtectionOfficer}}
Email: {{dpoEmail}}`,
      version: '1.0.0',
      effectiveDate: '2026-01-15',
      lastUpdated: '2026-01-15',
      isActive: true,
      requiresAcceptance: true,
      translations: {}
    }
  ]
};

// In-memory storage (replace with database in production)
let legalSettings: LegalSettings = { ...defaultLegalSettings };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function renderTemplate(content: string, settings: LegalSettings): string {
  return content
    .replace(/\{\{companyName\}\}/g, settings.companyName)
    .replace(/\{\{companyLegalName\}\}/g, settings.companyLegalName)
    .replace(/\{\{companyAddress\}\}/g, settings.companyAddress)
    .replace(/\{\{companyCity\}\}/g, settings.companyCity)
    .replace(/\{\{companyCountry\}\}/g, settings.companyCountry)
    .replace(/\{\{companyEmail\}\}/g, settings.companyEmail)
    .replace(/\{\{companyPhone\}\}/g, settings.companyPhone)
    .replace(/\{\{dataProtectionOfficer\}\}/g, settings.dataProtectionOfficer)
    .replace(/\{\{dpoEmail\}\}/g, settings.dpoEmail)
    .replace(/\{\{effectiveDate\}\}/g, new Date().toISOString().split('T')[0]);
}

// ============================================================================
// GET - Fetch legal settings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentSlug = searchParams.get('document');
    const rendered = searchParams.get('rendered') === 'true';
    const lang = searchParams.get('lang') || 'en';

    // Return specific document
    if (documentSlug) {
      const document = legalSettings.documents.find(d => d.slug === documentSlug);
      
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Check for translation
      let content = document.content;
      let title = document.title;
      
      if (lang !== 'en' && document.translations[lang]) {
        content = document.translations[lang].content;
        title = document.translations[lang].title;
      }

      // Render template variables if requested
      if (rendered) {
        content = renderTemplate(content, legalSettings);
      }

      return NextResponse.json({
        success: true,
        document: {
          ...document,
          title,
          content
        }
      });
    }

    // Return all settings
    return NextResponse.json({
      success: true,
      settings: {
        ...legalSettings,
        documents: legalSettings.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          version: doc.version,
          effectiveDate: doc.effectiveDate,
          lastUpdated: doc.lastUpdated,
          isActive: doc.isActive,
          requiresAcceptance: doc.requiresAcceptance,
          hasTranslations: Object.keys(doc.translations).length > 0,
          availableLanguages: ['en', ...Object.keys(doc.translations)]
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching legal settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update company info or create document
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'updateCompanyInfo') {
      const {
        companyName,
        companyLegalName,
        companyAddress,
        companyCity,
        companyCountry,
        companyRegistrationNumber,
        companyVatNumber,
        companyEmail,
        companyPhone,
        dataProtectionOfficer,
        dpoEmail
      } = body;

      legalSettings = {
        ...legalSettings,
        ...(companyName && { companyName }),
        ...(companyLegalName && { companyLegalName }),
        ...(companyAddress && { companyAddress }),
        ...(companyCity && { companyCity }),
        ...(companyCountry && { companyCountry }),
        ...(companyRegistrationNumber && { companyRegistrationNumber }),
        ...(companyVatNumber && { companyVatNumber }),
        ...(companyEmail && { companyEmail }),
        ...(companyPhone && { companyPhone }),
        ...(dataProtectionOfficer && { dataProtectionOfficer }),
        ...(dpoEmail && { dpoEmail })
      };

      return NextResponse.json({
        success: true,
        message: 'Company information updated successfully'
      });
    }

    if (action === 'createDocument') {
      const { document } = body;

      if (!document || !document.title || !document.slug || !document.content) {
        return NextResponse.json(
          { error: 'Missing required document fields' },
          { status: 400 }
        );
      }

      const newDocument: LegalDocument = {
        id: document.slug,
        title: document.title,
        slug: document.slug,
        content: document.content,
        version: '1.0.0',
        effectiveDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        requiresAcceptance: document.requiresAcceptance || false,
        translations: {}
      };

      legalSettings.documents.push(newDocument);

      return NextResponse.json({
        success: true,
        message: 'Document created successfully',
        document: newDocument
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating legal settings:', error);
    return NextResponse.json(
      { error: 'Failed to update legal settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update existing document
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, updates, translation } = body;

    const docIndex = legalSettings.documents.findIndex(d => d.id === documentId);

    if (docIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Add/update translation
    if (translation) {
      const { lang, title, content } = translation;
      
      if (!lang || !title || !content) {
        return NextResponse.json(
          { error: 'Missing translation fields' },
          { status: 400 }
        );
      }

      legalSettings.documents[docIndex].translations[lang] = {
        title,
        content
      };

      return NextResponse.json({
        success: true,
        message: `Translation for ${lang} added successfully`
      });
    }

    // Update document
    if (updates) {
      legalSettings.documents[docIndex] = {
        ...legalSettings.documents[docIndex],
        ...updates,
        lastUpdated: new Date().toISOString().split('T')[0],
        version: incrementVersion(legalSettings.documents[docIndex].version)
      };

      return NextResponse.json({
        success: true,
        message: 'Document updated successfully',
        document: legalSettings.documents[docIndex]
      });
    }

    return NextResponse.json(
      { error: 'No updates provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete document or translation
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const lang = searchParams.get('lang');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    const docIndex = legalSettings.documents.findIndex(d => d.id === documentId);

    if (docIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete specific translation
    if (lang) {
      delete legalSettings.documents[docIndex].translations[lang];
      return NextResponse.json({
        success: true,
        message: `Translation ${lang} deleted successfully`
      });
    }

    // Delete entire document
    legalSettings.documents.splice(docIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Version incrementer
// ============================================================================

function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] += 1;
  if (parts[2] >= 100) {
    parts[2] = 0;
    parts[1] += 1;
  }
  if (parts[1] >= 100) {
    parts[1] = 0;
    parts[0] += 1;
  }
  return parts.join('.');
}
