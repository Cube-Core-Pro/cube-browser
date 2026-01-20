'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CubeLogo } from '@/components/brand/CubeLogo';
import './about.css';

const TEAM_MEMBERS = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    image: '/team/ceo.jpg',
    bio: 'Former VP of Engineering at Salesforce. 15+ years in enterprise software.',
  },
  {
    name: 'Michael Rodriguez',
    role: 'CTO & Co-Founder',
    image: '/team/cto.jpg',
    bio: 'Ex-Google, led Chrome automation team. PhD in Computer Science from MIT.',
  },
  {
    name: 'Emily Watson',
    role: 'VP of Product',
    image: '/team/vp-product.jpg',
    bio: 'Previously at Notion and Figma. Passionate about user-centric design.',
  },
  {
    name: 'David Kim',
    role: 'VP of Engineering',
    image: '/team/vp-eng.jpg',
    bio: 'Former Principal Engineer at Microsoft. Expert in distributed systems.',
  },
];

const MILESTONES = [
  { year: '2023', title: 'Founded', description: 'CUBE was founded with a mission to democratize automation.' },
  { year: '2024', title: 'Series A', description: 'Raised $25M led by Sequoia Capital.' },
  { year: '2025', title: '100K Users', description: 'Reached 100,000 active users worldwide.' },
  { year: '2026', title: 'Enterprise Launch', description: 'Launched CUBE Enterprise with SOC2 certification.' },
];

const VALUES = [
  { icon: '🎯', title: 'Customer First', description: 'Every decision starts with how it helps our users.' },
  { icon: '🔒', title: 'Security Always', description: 'Security is not a feature, it is a foundation.' },
  { icon: '💡', title: 'Innovation', description: 'We push boundaries to solve real problems.' },
  { icon: '🤝', title: 'Transparency', description: 'Open communication inside and outside the company.' },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <span className="hero-badge">About CUBE</span>
          <h1>Building the future of automation</h1>
          <p>
            We believe everyone deserves access to powerful automation tools. 
            Our mission is to make browser automation accessible, secure, and intelligent.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p>
              At CUBE, we're on a mission to eliminate repetitive digital tasks and give 
              people back their time. We combine cutting-edge AI with intuitive design 
              to create automation tools that anyone can use.
            </p>
            <p>
              We believe that automation should be accessible to everyone, not just 
              developers. That's why we built CUBE to be visual, intelligent, and 
              enterprise-ready from day one.
            </p>
          </div>
          <div className="mission-stats">
            <div className="stat">
              <span className="stat-value">100K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat">
              <span className="stat-value">500M+</span>
              <span className="stat-label">Tasks Automated</span>
            </div>
            <div className="stat">
              <span className="stat-value">50+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <h2>Our Values</h2>
        <div className="values-grid">
          {VALUES.map((value, index) => (
            <div key={index} className="value-card">
              <span className="value-icon">{value.icon}</span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <h2>Our Journey</h2>
        <div className="timeline">
          {MILESTONES.map((milestone, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker">
                <span className="year">{milestone.year}</span>
              </div>
              <div className="timeline-content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>Leadership Team</h2>
        <p className="team-intro">
          Meet the people building the future of automation.
        </p>
        <div className="team-grid">
          {TEAM_MEMBERS.map((member, index) => (
            <div key={index} className="team-card">
              <div className="member-avatar">
                <span className="avatar-placeholder">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3>{member.name}</h3>
              <span className="member-role">{member.role}</span>
              <p>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Join Section */}
      <section className="join-section">
        <div className="join-content">
          <h2>Join Our Team</h2>
          <p>
            We're always looking for talented people to join our mission. 
            Check out our open positions.
          </p>
          <Link href="/careers" className="btn-primary">
            View Open Positions
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <CubeLogo size="md" />
            <p>© 2026 CUBE AI. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
