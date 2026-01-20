'use client';

import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import './page.css';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <SiteHeader variant="default" />
      
      <div className="legal-container">
        <article className="legal-content">
          <header className="legal-header">
            <h1>Terms of Service</h1>
            <p className="last-updated">Last updated: January 15, 2026</p>
          </header>

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using CUBE ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              CUBE provides a browser automation and data extraction platform that enables users to automate web-based tasks, 
              extract data from websites, and build automated workflows. The Service includes:
            </p>
            <ul>
              <li>Web browser automation capabilities</li>
              <li>Data extraction and processing tools</li>
              <li>Visual workflow builder</li>
              <li>Scheduling and monitoring features</li>
              <li>API access for programmatic control</li>
              <li>AI-powered assistance and suggestions</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must register for an account. When you register, you agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access</li>
              <li>Immediately notify us of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Access websites or data without authorization</li>
              <li>Circumvent security measures or access controls</li>
              <li>Engage in activities that could damage, disable, or impair the Service</li>
              <li>Collect personal data without proper consent</li>
              <li>Send spam or unsolicited communications</li>
              <li>Distribute malware or harmful code</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Subscription and Billing</h2>
            <p>
              Certain features of the Service require a paid subscription. By subscribing, you agree to:
            </p>
            <ul>
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Provide valid payment information</li>
              <li>Allow automatic renewal unless you cancel before the renewal date</li>
            </ul>
            <p>
              All fees are non-refundable except as expressly stated in our refund policy or as required by law.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by CUBE and are protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You retain all rights to data you submit, post, or display through the Service. By using the Service, 
              you grant us a license to host, store, and process your data as necessary to provide the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CUBE shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
              or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless CUBE and its officers, directors, employees, and agents 
              from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses arising 
              out of or relating to your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
              for any reason, including if you breach these Terms. Upon termination, your right to use the Service will 
              immediately cease.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide 
              at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be 
              determined at our sole discretion.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of Delaware, 
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: legal@cube.ai</li>
              <li>Address: 123 Innovation Drive, Suite 500, San Francisco, CA 94105</li>
            </ul>
          </section>
        </article>

        <footer className="legal-footer">
          <div className="footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/">Back to Home</Link>
          </div>
          <p className="copyright">© 2026 CUBE. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
