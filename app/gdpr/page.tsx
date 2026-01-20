'use client';

import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import '../privacy/page.css';

export default function GDPRPage() {
  return (
    <div className="legal-page">
      <SiteHeader variant="default" />
      
      <div className="legal-container">
        <article className="legal-content">
          <header className="legal-header">
            <h1>GDPR Compliance</h1>
            <p className="last-updated">Last updated: January 15, 2026</p>
          </header>

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              CUBE AI Tools ("we", "us", or "our") is committed to protecting the privacy and rights of 
              individuals in the European Economic Area (EEA) and United Kingdom. This page outlines how 
              we comply with the General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Your Rights Under GDPR</h2>
            <p>
              As a data subject, you have the following rights:
            </p>
            
            <h3>2.1 Right to Access</h3>
            <p>
              You have the right to request a copy of the personal data we hold about you.
            </p>

            <h3>2.2 Right to Rectification</h3>
            <p>
              You have the right to request that we correct any inaccurate personal data.
            </p>

            <h3>2.3 Right to Erasure</h3>
            <p>
              You have the right to request that we delete your personal data (also known as the "right to be forgotten").
            </p>

            <h3>2.4 Right to Restrict Processing</h3>
            <p>
              You have the right to request that we limit how we use your personal data.
            </p>

            <h3>2.5 Right to Data Portability</h3>
            <p>
              You have the right to receive your personal data in a structured, commonly used format.
            </p>

            <h3>2.6 Right to Object</h3>
            <p>
              You have the right to object to certain types of processing, including direct marketing.
            </p>

            <h3>2.7 Rights Related to Automated Decision-Making</h3>
            <p>
              You have rights regarding automated decision-making and profiling.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Legal Basis for Processing</h2>
            <p>
              We process personal data based on one or more of the following legal bases:
            </p>
            <ul>
              <li><strong>Contract:</strong> Processing necessary for the performance of a contract with you</li>
              <li><strong>Consent:</strong> You have given consent for specific processing purposes</li>
              <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests</li>
              <li><strong>Legal Obligation:</strong> Processing necessary to comply with legal requirements</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Data We Collect</h2>
            <p>
              We collect and process the following categories of personal data:
            </p>
            <ul>
              <li>Identity data (name, username)</li>
              <li>Contact data (email address, phone number)</li>
              <li>Technical data (IP address, browser type, device information)</li>
              <li>Usage data (how you use our services)</li>
              <li>Financial data (payment information, processed by Stripe)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Transfers</h2>
            <p>
              We may transfer your personal data outside the EEA. When we do, we ensure appropriate 
              safeguards are in place:
            </p>
            <ul>
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Transfers to countries with adequacy decisions</li>
              <li>Binding Corporate Rules where applicable</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Data Retention</h2>
            <p>
              We retain personal data only for as long as necessary:
            </p>
            <ul>
              <li>Account data: For the duration of your account plus 2 years</li>
              <li>Transaction data: 7 years (legal requirement)</li>
              <li>Marketing preferences: Until you withdraw consent</li>
              <li>Usage logs: 90 days</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Data Protection Officer</h2>
            <p>
              For GDPR-related inquiries, please contact our Data Protection team:
            </p>
            <ul>
              <li>Email: dpo@cubeai.tools</li>
              <li>Address: CUBE AI Tools, Data Protection, Delaware, USA</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Exercising Your Rights</h2>
            <p>
              To exercise any of your GDPR rights, please:
            </p>
            <ul>
              <li>Email us at privacy@cubeai.tools</li>
              <li>Use the data management tools in your account settings</li>
              <li>Contact us through our support channels</li>
            </ul>
            <p>
              We will respond to your request within 30 days as required by GDPR.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Supervisory Authority</h2>
            <p>
              If you are not satisfied with how we handle your data, you have the right to lodge a 
              complaint with a supervisory authority in your EU member state.
            </p>
          </section>

          <div className="legal-footer">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Policy</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
