'use client';

/**
 * CUBE Nexum - Language Selector Component
 * Premium dropdown for selecting language
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline' | 'minimal';
  showFlag?: boolean;
  showNative?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNative = true,
  className = ''
}: LanguageSelectorProps) {
  const { lang, setLang, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'minimal') {
    return (
      <div className={`lang-selector lang-selector--minimal ${className}`} ref={dropdownRef}>
        <button
          className="lang-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select language"
        >
          <Globe className="w-4 h-4" />
          <span>{currentLang.code.toUpperCase()}</span>
        </button>
        {isOpen && (
          <div className="lang-selector__dropdown">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`lang-selector__option ${lang === language.code ? 'active' : ''}`}
                onClick={() => { setLang(language.code); setIsOpen(false); }}
              >
                {showFlag && <span className="lang-flag">{language.flag}</span>}
                <span className="lang-code">{language.code.toUpperCase()}</span>
                {lang === language.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`lang-selector lang-selector--inline ${className}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            className={`lang-selector__inline-btn ${lang === language.code ? 'active' : ''}`}
            onClick={() => setLang(language.code)}
            title={language.name}
          >
            {showFlag ? language.flag : language.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`lang-selector lang-selector--dropdown ${className}`} ref={dropdownRef}>
      <button
        className="lang-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && <span className="lang-flag">{currentLang.flag}</span>}
        <span className="lang-name">
          {showNative ? currentLang.native : currentLang.name}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="lang-selector__dropdown" role="listbox">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`lang-selector__option ${lang === language.code ? 'active' : ''}`}
              onClick={() => { setLang(language.code); setIsOpen(false); }}
              role="option"
              aria-selected={lang === language.code}
            >
              {showFlag && <span className="lang-flag">{language.flag}</span>}
              <div className="lang-info">
                <span className="lang-native">{language.native}</span>
                <span className="lang-english">{language.name}</span>
              </div>
              {lang === language.code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
