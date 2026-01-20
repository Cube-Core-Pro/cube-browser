'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CubeLogo } from '@/components/brand/CubeLogo';
import './careers.css';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Manager';
}

const JOB_POSITIONS: JobPosition[] = [
  // Engineering
  { id: 'sr-frontend', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Senior' },
  { id: 'sr-backend', title: 'Senior Backend Engineer (Rust)', department: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Senior' },
  { id: 'staff-eng', title: 'Staff Engineer', department: 'Engineering', location: 'San Francisco', type: 'Full-time', level: 'Lead' },
  { id: 'devops', title: 'DevOps Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Mid' },
  { id: 'ml-eng', title: 'Machine Learning Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Senior' },
  // Product
  { id: 'product-mgr', title: 'Product Manager', department: 'Product', location: 'San Francisco', type: 'Full-time', level: 'Mid' },
  { id: 'product-designer', title: 'Product Designer', department: 'Product', location: 'Remote', type: 'Full-time', level: 'Senior' },
  // Sales & Marketing
  { id: 'ae', title: 'Account Executive', department: 'Sales', location: 'New York', type: 'Full-time', level: 'Mid' },
  { id: 'growth-marketer', title: 'Growth Marketing Manager', department: 'Marketing', location: 'Remote', type: 'Full-time', level: 'Senior' },
  // Customer Success
  { id: 'cs-mgr', title: 'Customer Success Manager', department: 'Customer Success', location: 'Remote', type: 'Full-time', level: 'Mid' },
];

const DEPARTMENTS = ['All', 'Engineering', 'Product', 'Sales', 'Marketing', 'Customer Success'];

const PERKS = [
  { icon: '🏥', title: 'Health & Wellness', description: 'Comprehensive health, dental, and vision insurance for you and your family.' },
  { icon: '🌴', title: 'Unlimited PTO', description: 'Take the time you need to rest and recharge. We trust you.' },
  { icon: '💰', title: 'Competitive Equity', description: 'Be an owner. All employees receive meaningful equity grants.' },
  { icon: '🏠', title: 'Remote First', description: 'Work from anywhere. We have team members across 15 countries.' },
  { icon: '📚', title: 'Learning Budget', description: '$2,000 annual budget for courses, books, and conferences.' },
  { icon: '🖥️', title: 'Premium Setup', description: 'MacBook Pro, 4K monitor, and $500 for your home office.' },
];

export default function CareersPage() {
  const [activeDepartment, setActiveDepartment] = useState('All');
  
  const filteredJobs = activeDepartment === 'All' 
    ? JOB_POSITIONS 
    : JOB_POSITIONS.filter(job => job.department === activeDepartment);

  return (
    <div className="careers-page">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="careers-hero">
        <div className="hero-content">
          <span className="hero-badge">We're Hiring!</span>
          <h1>Build the future of automation</h1>
          <p>
            Join a world-class team solving hard problems and helping millions 
            of people work smarter.
          </p>
          <a href="#positions" className="btn-primary">
            View Open Positions
          </a>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-content">
          <h2>Why CUBE?</h2>
          <p className="values-intro">
            We're building something special and we want you to be part of it.
          </p>
          <div className="values-grid">
            <div className="value-item">
              <span className="value-icon">🚀</span>
              <h3>High Impact</h3>
              <p>Your work directly impacts millions of users worldwide.</p>
            </div>
            <div className="value-item">
              <span className="value-icon">🧠</span>
              <h3>Hard Problems</h3>
              <p>Work on cutting-edge AI, browser automation, and security.</p>
            </div>
            <div className="value-item">
              <span className="value-icon">🌍</span>
              <h3>Global Team</h3>
              <p>Collaborate with talented people from 15+ countries.</p>
            </div>
            <div className="value-item">
              <span className="value-icon">📈</span>
              <h3>Fast Growth</h3>
              <p>We're growing fast and you'll grow with us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="perks-section">
        <h2>Benefits & Perks</h2>
        <div className="perks-grid">
          {PERKS.map((perk, index) => (
            <div key={index} className="perk-card">
              <span className="perk-icon">{perk.icon}</span>
              <h3>{perk.title}</h3>
              <p>{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Positions Section */}
      <section id="positions" className="positions-section">
        <h2>Open Positions</h2>
        
        {/* Department Filter */}
        <div className="department-filter">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              className={`filter-btn ${activeDepartment === dept ? 'active' : ''}`}
              onClick={() => setActiveDepartment(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
        
        {/* Job Listings */}
        <div className="jobs-list">
          {filteredJobs.map(job => (
            <Link key={job.id} href={`/careers/${job.id}`} className="job-card">
              <div className="job-info">
                <h3>{job.title}</h3>
                <div className="job-meta">
                  <span className="department">{job.department}</span>
                  <span className="separator">•</span>
                  <span className="location">{job.location}</span>
                  <span className="separator">•</span>
                  <span className="type">{job.type}</span>
                </div>
              </div>
              <div className="job-action">
                <span className="level-badge">{job.level}</span>
                <span className="arrow">→</span>
              </div>
            </Link>
          ))}
          
          {filteredJobs.length === 0 && (
            <div className="no-jobs">
              <p>No open positions in this department at the moment.</p>
              <p>Check back soon or send us your resume at <a href="mailto:careers@cubeai.tools">careers@cubeai.tools</a></p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Don't see a fit?</h2>
          <p>
            We're always looking for exceptional people. Send us your resume 
            and we'll be in touch when something opens up.
          </p>
          <a href="mailto:careers@cubeai.tools" className="btn-primary">
            Send Your Resume
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="careers-footer">
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
