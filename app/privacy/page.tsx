'use client';

import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import './page.css';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <SiteHeader variant="default" />
      
      <div className="legal-container">
        <article className="legal-content">
          <header className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: January 15, 2026</p>
          </header>

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              CUBE ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our browser automation platform 
              and related services (collectively, the "Service").
            </p>
            <p>
              Please read this Privacy Policy carefully. By using the Service, you consent to the practices described 
              in this policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect personal information that you provide directly, including:</p>
            <ul>
              <li>Name and email address</li>
              <li>Company name and job title</li>
              <li>Billing and payment information</li>
              <li>Phone number</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3>2.2 Usage Information</h3>
            <p>We automatically collect information about how you use the Service:</p>
            <ul>
              <li>Log data (IP address, browser type, operating system)</li>
              <li>Device information</li>
              <li>Pages visited and features used</li>
              <li>Workflow configurations and automation patterns</li>
              <li>Performance metrics and error logs</li>
            </ul>

            <h3>2.3 Data Processed Through the Service</h3>
            <p>
              When you use CUBE for automation tasks, we may process data from websites you interact with. 
              This data is processed according to your instructions and is not used for any other purpose.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Develop new features and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Information Sharing</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
              <li><strong>With Your Consent:</strong> When you have given us permission</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication measures</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p>
              While we strive to protect your information, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide the Service and fulfill the 
              purposes described in this policy, unless a longer retention period is required by law.
            </p>
            <p>
              You can request deletion of your data at any time by contacting us or using the account settings.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@cube.ai.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers, including Standard Contractual 
              Clauses approved by relevant authorities.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track information about your use 
              of the Service. You can control cookie preferences through your browser settings.
            </p>
            <p>Types of cookies we use:</p>
            <ul>
              <li><strong>Essential:</strong> Required for the Service to function</li>
              <li><strong>Analytics:</strong> Help us understand how the Service is used</li>
              <li><strong>Preferences:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing:</strong> Used for targeted advertising (with consent)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 16 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date. We encourage you to review this 
              policy periodically.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Email: privacy@cube.ai</li>
              <li>Data Protection Officer: dpo@cube.ai</li>
              <li>Address: 123 Innovation Drive, Suite 500, San Francisco, CA 94105</li>
            </ul>
          </section>

          <section className="legal-section compliance-badges">
            <h2>13. Compliance</h2>
            <div className="badges-container">
              <div className="compliance-badge">
                <span className="badge-icon">🔒</span>
                <span className="badge-text">SOC 2 Type II</span>
              </div>
              <div className="compliance-badge">
                <span className="badge-icon">🇪🇺</span>
                <span className="badge-text">GDPR Compliant</span>
              </div>
              <div className="compliance-badge">
                <span className="badge-icon">🇺🇸</span>
                <span className="badge-text">CCPA Compliant</span>
              </div>
              <div className="compliance-badge">
                <span className="badge-icon">🏥</span>
                <span className="badge-text">HIPAA Ready</span>
              </div>
            </div>
          </section>
        </article>

        <footer className="legal-footer">
          <div className="footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/">Back to Home</Link>
          </div>
          <p className="copyright">© 2026 CUBE. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
