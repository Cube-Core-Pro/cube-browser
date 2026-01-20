'use client';

import React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import '../privacy/page.css';

export default function CookiesPage() {
  return (
    <div className="legal-page">
      <SiteHeader variant="default" />
      
      <div className="legal-container">
        <article className="legal-content">
          <header className="legal-header">
            <h1>Cookie Policy</h1>
            <p className="last-updated">Last updated: January 15, 2026</p>
          </header>

          <section className="legal-section">
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences, 
              understanding how you use our site, and improving our services.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Types of Cookies We Use</h2>
            
            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, network management, and account access. You cannot opt out of these cookies.
            </p>
            <ul>
              <li>Session management cookies</li>
              <li>Authentication cookies</li>
              <li>Security cookies</li>
              <li>Load balancing cookies</li>
            </ul>

            <h3>2.2 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and 
              reporting information anonymously.
            </p>
            <ul>
              <li>Page view tracking</li>
              <li>User journey analysis</li>
              <li>Performance monitoring</li>
            </ul>

            <h3>2.3 Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your 
              language preferences and login details.
            </p>
            <ul>
              <li>Language preference cookies</li>
              <li>Theme preference cookies</li>
              <li>User interface customization</li>
            </ul>

            <h3>2.4 Marketing Cookies</h3>
            <p>
              These cookies are used to track visitors across websites to display relevant advertisements. 
              We use these sparingly and you can opt out at any time.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. How to Manage Cookies</h2>
            <p>
              You can control and manage cookies in several ways:
            </p>
            <ul>
              <li><strong>Browser settings:</strong> Most browsers allow you to refuse or accept cookies through their settings</li>
              <li><strong>Our cookie banner:</strong> When you first visit our site, you can choose which cookies to accept</li>
              <li><strong>Third-party tools:</strong> You can use browser extensions to manage cookies</li>
            </ul>
            <p>
              Please note that disabling certain cookies may affect the functionality of our services.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We do not control 
              these cookies and recommend reviewing the privacy policies of these third parties:
            </p>
            <ul>
              <li>Stripe (payment processing)</li>
              <li>Google Analytics (website analytics)</li>
              <li>Intercom (customer support)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Cookie Retention</h2>
            <p>
              Different cookies have different retention periods:
            </p>
            <ul>
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent cookies:</strong> Remain for up to 12 months</li>
              <li><strong>Authentication cookies:</strong> Up to 30 days (or until logout)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page 
              with an updated revision date.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@cubeai.tools</li>
              <li>Address: CUBE AI Tools, Delaware, USA</li>
            </ul>
          </section>

          <div className="legal-footer">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/gdpr">GDPR</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
