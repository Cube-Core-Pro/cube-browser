'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Mail, Menu, X, Briefcase, Layers, Globe } from 'lucide-react';
import { CubeLogo } from '@/components/brand/CubeLogo';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import './SiteHeader.css';

interface SiteHeaderProps {
  variant?: 'default' | 'investors' | 'dark' | 'minimal';
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
  showLanguageSelector?: boolean;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  variant = 'default',
  showCTA = true,
  ctaText = 'Get Started',
  ctaHref = '/get',
  showLanguageSelector = true,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use light logo theme for dark backgrounds (investors, dark variants)
  const logoTheme = (variant === 'investors' || variant === 'dark') ? 'light' : 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''} site-header--${variant}`}>
      <div className="site-header__container">
        {/* Logo */}
        <a href="/" className="site-header__logo" aria-label="CUBE AI Home">
          <CubeLogo variant="horizontal" size="md" theme={logoTheme} />
        </a>

        {/* Desktop Navigation */}
        <nav className={`site-header__nav ${isMenuOpen ? 'open' : ''}`}>
          <a href="/landing#features" className="site-header__link">Features</a>
          <a href="/pricing" className="site-header__link">Pricing</a>
          
          {/* Products Dropdown */}
          <div className="site-header__dropdown">
            <button className="site-header__dropdown-trigger">
              Products <ChevronDown className="w-4 h-4" />
            </button>
            <div className="site-header__dropdown-menu">
              <a href="/get" className="site-header__dropdown-item site-header__dropdown-item--featured">
                <CubeLogo variant="icon" size="sm" theme={logoTheme} />
                <div className="site-header__dropdown-text">
                  <span>CUBE Nexum</span>
                  <small>Browser Automation</small>
                </div>
              </a>
              <a href="/cubemail" className="site-header__dropdown-item">
                <Mail className="w-5 h-5" />
                <div className="site-header__dropdown-text">
                  <span>CubeMail</span>
                  <small>Private Email</small>
                </div>
              </a>
              <a href="/waitlist/cube-core" className="site-header__dropdown-item">
                <Layers className="w-5 h-5" />
                <div className="site-header__dropdown-text">
                  <span>CUBE Core</span>
                  <small>Enterprise Suite</small>
                </div>
              </a>
              <a href="/investors" className="site-header__dropdown-item">
                <Briefcase className="w-5 h-5" />
                <div className="site-header__dropdown-text">
                  <span>CUBE Finance</span>
                  <small>Fintech Solutions</small>
                </div>
              </a>
            </div>
          </div>

          {/* Special Links */}
          <a href="/investors" className="site-header__link site-header__link--investors">
            Investors
          </a>
          <a href="/affiliates" className="site-header__link site-header__link--affiliates">
            Affiliates
          </a>
        </nav>

        {/* Actions */}
        <div className="site-header__actions">
          {/* Language Selector */}
          {showLanguageSelector && (
            <LanguageSelector 
              variant="compact" 
              theme={variant === 'dark' || variant === 'investors' ? 'dark' : 'light'}
            />
          )}
          
          <a href="/login" className="site-header__link">Sign In</a>
          {showCTA && (
            <a href={ctaHref} className="site-header__cta">
              {ctaText}
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="site-header__mobile-btn"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
};

export default SiteHeader;
