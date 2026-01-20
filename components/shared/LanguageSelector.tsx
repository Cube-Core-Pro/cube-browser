'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n, localeNames, type Locale, locales, isRtlLocale } from '@/components/providers/I18nProvider';
import './LanguageSelector.css';

// Language metadata with flags
const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  pt: '🇧🇷',
  it: '🇮🇹',
  de: '🇩🇪',
  fr: '🇫🇷',
  tr: '🇹🇷',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ar: '🇸🇦',
  ru: '🇷🇺',
};

interface LanguageSelectorProps {
  /** Variant style */
  variant?: 'default' | 'compact' | 'dropdown' | 'full';
  /** Theme for styling */
  theme?: 'light' | 'dark' | 'auto';
  /** Called when language changes */
  onChange?: (code: Locale) => void;
  /** Additional class name */
  className?: string;
  /** Show native language name */
  showNative?: boolean;
  /** Show flag emoji */
  showFlag?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  theme = 'auto',
  onChange,
  className = '',
  showNative = true,
  showFlag = true,
}) => {
  // Use the I18n context for real language switching
  const { locale, setLocale, isRtl } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mark as loaded after mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language selection
  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
    
    // Notify parent
    if (onChange) {
      onChange(code);
    }
  };

  // Get current language info
  const currentFlag = languageFlags[locale] || '🌐';
  const currentName = localeNames[locale] || 'English';

  // Determine theme class
  const themeClass = theme === 'auto' 
    ? '' 
    : `language-selector--${theme}`;

  if (!isLoaded) {
    return (
      <div className={`language-selector language-selector--loading ${className}`}>
        <span className="language-selector__flag">🌐</span>
      </div>
    );
  }

  // Compact variant - just icon
  if (variant === 'compact') {
    return (
      <div 
        className={`language-selector language-selector--compact ${themeClass} ${className}`}
        ref={dropdownRef}
      >
        <button
          className="language-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <span className="language-selector__flag">{currentFlag}</span>
        </button>
        
        {isOpen && (
          <div className="language-selector__menu">
            {locales.map((code) => (
              <button
                key={code}
                className={`language-selector__option ${code === locale ? 'active' : ''}`}
                onClick={() => handleSelect(code)}
              >
                {showFlag && <span className="language-selector__flag">{languageFlags[code]}</span>}
                <span className="language-selector__name">
                  {localeNames[code]}
                </span>
                {isRtlLocale(code) && (
                  <span className="language-selector__rtl-badge">RTL</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant - default
  if (variant === 'dropdown') {
    return (
      <div 
        className={`language-selector language-selector--dropdown ${themeClass} ${className}`}
        ref={dropdownRef}
      >
        <button
          className="language-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          {showFlag && <span className="language-selector__flag">{currentFlag}</span>}
          <span className="language-selector__current">{currentName}</span>
          <svg 
            className={`language-selector__arrow ${isOpen ? 'open' : ''}`} 
            width="12" 
            height="12" 
            viewBox="0 0 12 12"
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="language-selector__menu">
            {locales.map((code) => (
              <button
                key={code}
                className={`language-selector__option ${code === locale ? 'active' : ''}`}
                onClick={() => handleSelect(code)}
              >
                {showFlag && <span className="language-selector__flag">{languageFlags[code]}</span>}
                <span className="language-selector__name">{localeNames[code]}</span>
                {code === locale && (
                  <svg className="language-selector__check" width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full variant - shows all languages as grid
  if (variant === 'full') {
    return (
      <div className={`language-selector language-selector--full ${themeClass} ${className}`}>
        <div className="language-selector__grid">
          {locales.map((code) => (
            <button
              key={code}
              className={`language-selector__card ${code === locale ? 'active' : ''}`}
              onClick={() => handleSelect(code)}
            >
              <span className="language-selector__flag-large">{languageFlags[code]}</span>
              <span className="language-selector__name-primary">{localeNames[code]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant - inline buttons
  return (
    <div className={`language-selector language-selector--default ${themeClass} ${className}`}>
      <div className="language-selector__list">
        {locales.map((code) => (
          <button
            key={code}
            className={`language-selector__btn ${code === locale ? 'active' : ''}`}
            onClick={() => handleSelect(code)}
            title={localeNames[code]}
          >
            {showFlag && <span className="language-selector__flag">{languageFlags[code]}</span>}
            {localeNames[code]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
