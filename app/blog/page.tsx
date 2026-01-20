'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CubeLogo } from '@/components/brand/CubeLogo';
import './blog.css';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'introducing-cube-enterprise',
    title: 'Introducing CUBE Enterprise: Automation for the Modern Organization',
    excerpt: 'Today we are launching CUBE Enterprise, bringing SOC2-certified automation to organizations of all sizes with SSO, SCIM, and advanced analytics.',
    category: 'Product',
    author: 'Sarah Chen',
    date: 'January 15, 2026',
    readTime: '5 min read',
    image: '/blog/enterprise.jpg',
    featured: true,
  },
  {
    id: 'ai-powered-selectors',
    title: 'How AI is Revolutionizing Browser Automation',
    excerpt: 'Learn how our new AI-powered selector engine makes automation more reliable and easier to maintain than ever before.',
    category: 'AI',
    author: 'Michael Rodriguez',
    date: 'January 10, 2026',
    readTime: '8 min read',
    image: '/blog/ai-selectors.jpg',
  },
  {
    id: 'security-best-practices',
    title: 'Security Best Practices for Browser Automation',
    excerpt: 'A comprehensive guide to keeping your automation workflows secure, from credential management to network isolation.',
    category: 'Security',
    author: 'David Kim',
    date: 'January 5, 2026',
    readTime: '10 min read',
    image: '/blog/security.jpg',
  },
  {
    id: 'automation-roi-guide',
    title: 'Calculating the ROI of Automation: A Complete Guide',
    excerpt: 'How to measure the impact of automation on your organization and communicate value to stakeholders.',
    category: 'Business',
    author: 'Emily Watson',
    date: 'December 28, 2025',
    readTime: '7 min read',
    image: '/blog/roi.jpg',
  },
  {
    id: 'cubemail-launch',
    title: 'Announcing CubeMail: Privacy-First Email for Teams',
    excerpt: 'Introducing our new encrypted email service with end-to-end encryption and zero-knowledge architecture.',
    category: 'Product',
    author: 'Sarah Chen',
    date: 'December 20, 2025',
    readTime: '4 min read',
    image: '/blog/cubemail.jpg',
  },
  {
    id: 'workflow-templates',
    title: '10 Essential Workflow Templates for Every Team',
    excerpt: 'Get started faster with our curated collection of automation templates for sales, marketing, and operations.',
    category: 'Templates',
    author: 'Emily Watson',
    date: 'December 15, 2025',
    readTime: '6 min read',
    image: '/blog/templates.jpg',
  },
];

const CATEGORIES = ['All', 'Product', 'AI', 'Security', 'Business', 'Templates'];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const featuredPost = BLOG_POSTS.find(p => p.featured);
  const filteredPosts = activeCategory === 'All' 
    ? BLOG_POSTS.filter(p => !p.featured)
    : BLOG_POSTS.filter(p => p.category === activeCategory && !p.featured);

  return (
    <div className="blog-page">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1>CUBE Blog</h1>
          <p>
            Insights, tutorials, and updates from the CUBE team. 
            Learn how to automate smarter.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="featured-section">
          <div className="featured-container">
            <div className="featured-badge">Featured</div>
            <Link href={`/blog/${featuredPost.id}`} className="featured-card">
              <div className="featured-image">
                <div className="image-placeholder">
                  <span>📰</span>
                </div>
              </div>
              <div className="featured-content">
                <span className="post-category">{featuredPost.category}</span>
                <h2>{featuredPost.title}</h2>
                <p>{featuredPost.excerpt}</p>
                <div className="post-meta">
                  <span className="author">{featuredPost.author}</span>
                  <span className="separator">•</span>
                  <span className="date">{featuredPost.date}</span>
                  <span className="separator">•</span>
                  <span className="read-time">{featuredPost.readTime}</span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="category-filter">
        <div className="filter-container">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="posts-section">
        <div className="posts-grid">
          {filteredPosts.map(post => (
            <Link key={post.id} href={`/blog/${post.id}`} className="post-card">
              <div className="post-image">
                <div className="image-placeholder">
                  <span>📄</span>
                </div>
              </div>
              <div className="post-content">
                <span className="post-category">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-meta">
                  <span className="author">{post.author}</span>
                  <span className="separator">•</span>
                  <span className="read-time">{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Stay Updated</h2>
          <p>Get the latest automation tips and product updates delivered to your inbox.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email"
              aria-label="Email address for newsletter"
            />
            <button type="submit">Subscribe</button>
          </form>
          <span className="newsletter-note">No spam. Unsubscribe anytime.</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="blog-footer">
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
